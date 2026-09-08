# AGENTS.md

## Operational Commands

- Package manager is fixed to `bun` (bun.lock present) — do not use npm/yarn/pnpm.
- `bun install` — install dependencies.
- `bun run dev` — runs API server (port 3002) and Vite dev server (port 5173) concurrently via `concurrently` (package.json:7). Vite proxies `/api/*` to `http://localhost:3002` (vite.config.ts:8-15).
- `bun run server` — API server only (`bun --watch run server/index.ts`).
- `bun run build` — `tsc -b && vite build`. Note: `tsc -b` only typechecks via tsconfig.json's references (tsconfig.app.json `include: ["src"]`, tsconfig.node.json `include: ["vite.config.ts"]`) — `server/` is NOT included, so type errors under `server/` are not caught by this command.
- `bun run lint` — `eslint .`.
- `bun test` / `bun run test:watch` — Vitest. Included paths: `src/**/*.test.{ts,tsx}` and `server/**/*.test.ts` (vite.config.ts:20).

## Golden Rules

**Security Boundary.** `GET /api/config` must only return boolean presence flags, never raw keys: `envKeys: { anthropic: !!ENV_KEYS.anthropic, google: !!ENV_KEYS.google }` (server/index.ts:147-157). Never add a response field or log line that exposes `process.env.ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` to the client.

**Hard Constraint.** Generated component code is executed by react-live in `noInline` mode (src/components/LivePreview.tsx:14: `<LiveProvider code={code} noInline>`). Any code reaching that component must be plain JS/JSX only — no `import`/`export`, no TypeScript syntax — and must end with a `render(<X />)` call. This is why `SYSTEM_PROMPT` explicitly forbids TS syntax and imports (server/index.ts:9-20).

**Double Defense.** The `render()` requirement above is enforced twice, independently: `SYSTEM_PROMPT` instructs the model to call `render(...)` (server/index.ts:13, 49), and `ensureRenderCall` (server/generator.ts:16-24) injects a `render()` call if the model's output omits it. Keep both — the prompt instruction alone is not reliable enough, which is why the fallback function exists and is unit-tested (server/generator.test.ts:31-34).

**Asymmetry.** Google requests are routed through `withModelFallback` across `GOOGLE_MODELS` (server/index.ts:5, 98, 134-136) and get an explicit `MAX_TOKENS` truncation message (server/index.ts:123-125). Anthropic requests (server/index.ts:68-96) have neither model fallback nor a finish-reason/truncation check. If you add retry, fallback, or truncation handling for one provider, decide explicitly whether Anthropic needs the same treatment — don't assume the asymmetry is accidental or copy one side's behavior without checking.

**Test Boundary.** Only side-effect-free logic is tested: `server/generator.ts` and `server/fallback.ts` (both have `*.test.ts` files) vs. `server/index.ts` (`Bun.serve` + external `fetch` calls — untested). Same pattern in `src/`: `PromptInput.tsx` has a test, `useComponentGenerator.ts`, `App.tsx`, `LivePreview.tsx`, `ComponentCard.tsx`, `CodeView.tsx` do not. When adding non-trivial logic, prefer extracting a pure function into a `generator.ts`/`fallback.ts`-style module rather than growing `index.ts` or the hook — that's the pattern this codebase already uses to stay testable.

## Project Context

AI 프롬프트를 입력하면 React 컴포넌트를 생성해 즉시 미리보기와 코드로 보여주는 도구. Bun API 프록시가 요청을 Anthropic Claude 또는 Google Gemini 중 선택된 provider로 전달하고, 프론트엔드는 react-live로 결과를 즉시 렌더링한다.

**Tech Stack:** React 19, TypeScript, Vite, Bun, react-live, Vitest, ESLint, Anthropic Claude API, Google Gemini API.

## Standards & References

- 코딩 컨벤션과 프로젝트 소개는 `README.md` 참고.
- 이 디렉토리는 git 저장소가 아니다 — 커밋 메시지/브랜치 전략 없음. 저장소가 초기화되면 이 섹션을 갱신할 것.
- **Maintenance Policy:** 코드가 변경되어 위 Golden Rules와 실제 동작이 어긋나면, 규칙을 조용히 무시하지 말고 이 파일의 업데이트를 제안할 것.

## Context Map

- **[API/프롬프트 서버 작업](./server/AGENTS.md)** — `server/` 내부에서 provider 연동, 프롬프트, 코드 정규화 로직을 수정할 때.
