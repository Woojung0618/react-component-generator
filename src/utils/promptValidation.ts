export const MAX_PROMPT_LENGTH = 500;

export interface PromptValidationResult {
  valid: boolean;
  error: string | null;
}

export function validatePrompt(prompt: string): PromptValidationResult {
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `프롬프트는 500자를 초과할 수 없습니다. (${prompt.length}/${MAX_PROMPT_LENGTH})`,
    };
  }

  return { valid: true, error: null };
}
