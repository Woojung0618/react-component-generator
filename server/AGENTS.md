# server/AGENTS.md

## Module Context

Bun 기반 API 프록시 서버. 프론트엔드의 `/api/*` 요청을 받아 Anthropic 또는 Google 중 선택된 provider로 전달하고, 응답 텍스트를 react-live에서 실행 가능한 코드로 정규화한다.

## Tech Stack & Constraints

- `Bun.serve`만 사용한다 — Express/Fastify 등 별도 HTTP 프레임워크를 도입하지 말 것 (server/index.ts:138).
- 외부 AI 호출은 네이티브 `fetch`만 사용한다 — axios 등 HTTP 클라이언트 라이브러리 미사용 (server/index.ts:69, 101).
- `server/`는 루트 tsconfig의 project reference에 포함되지 않는다 (tsconfig.json은 tsconfig.app.json`(include: ["src"])`과 tsconfig.node.json`(include: ["vite.config.ts"])`만 참조). 따라서 `bun run build`의 `tsc -b`는 이 폴더의 타입 오류를 잡지 못한다 — Bun 런타임 실행이나 에디터 타입체크로 직접 확인할 것.

## Implementation Patterns

- 새 provider를 추가할 때는 기존 3단 패턴을 따른다: `ENV_KEYS`에 키 등록(server/index.ts:59-62) → `resolveApiKey`로 클라이언트/환경변수 키 해석(server/index.ts:64-66) → `call<Provider>` 함수 추가 후 `/api/generate` 분기(server/index.ts:183-186).
- 부수효과 없는 변환/재시도 로직은 `generator.ts`(텍스트 정규화)와 `fallback.ts`(모델 폴백)처럼 별도 순수 함수 모듈로 분리한다 — `index.ts`에 직접 추가하지 않는다.

## Testing Strategy

- `bun test`가 `server/**/*.test.ts`를 포함한다 (vite.config.ts:20).
- 기존 테스트(`generator.test.ts`, `fallback.test.ts`)는 순수 함수만 대상으로 한다. `index.ts`의 HTTP 핸들링/외부 API 호출에는 테스트가 없다 — 이 파일을 수정하면 `bun run dev`로 수동 확인이 필요하다.

## Local Golden Rules

- **정밀도(Precedence) 규칙:** `resolveApiKey`는 `clientKey || ENV_KEYS[provider] || null` 순서로 평가한다(server/index.ts:64-66) — 클라이언트가 직접 입력한 키가 `.env` 키보다 항상 우선한다. 이는 README에 명시된 "직접 입력으로 덮어쓰기" 기능을 위한 의도된 순서이므로, "환경변수를 우선해야 하지 않나"라는 판단으로 순서를 바꾸지 말 것.
- **CORS 전제:** `CORS_HEADERS`는 `Access-Control-Allow-Origin: '*'`를 사용한다(server/index.ts:51-55). 이는 로컬 전용 프록시(vite.config.ts의 `/api` → `http://localhost:3002`)라는 전제하에 의도된 설정이다. 배포 환경으로 확장하거나 인증을 추가할 때는 이 전제가 여전히 유효한지 먼저 확인할 것.
- **프롬프트는 제품 자산:** `SYSTEM_PROMPT`(server/index.ts:7-49)의 문구 하나(예: "no TypeScript syntax", "no import statements")를 바꾸면 `src/components/LivePreview.tsx`의 `noInline` react-live 렌더링이 깨질 수 있다. 이 프롬프트를 수정할 때는 프론트엔드의 실행 방식(루트 AGENTS.md의 Hard Constraint 참고)과 함께 검토할 것.
