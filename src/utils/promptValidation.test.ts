import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePrompt } from './promptValidation';

describe('validatePrompt', () => {
  it('빈 문자열은 유효하다', () => {
    expect(validatePrompt('')).toEqual({ valid: true, error: null });
  });

  it('500자 이하이면 유효하다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH);
    expect(validatePrompt(prompt)).toEqual({ valid: true, error: null });
  });

  it('501자이면 무효하고 에러 메시지를 반환한다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH + 1);
    const result = validatePrompt(prompt);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('프롬프트는 500자를 초과할 수 없습니다. (501/500)');
  });

  it('에러 메시지는 실제 입력 길이를 반영한다', () => {
    const prompt = 'a'.repeat(600);
    const result = validatePrompt(prompt);
    expect(result.error).toBe('프롬프트는 500자를 초과할 수 없습니다. (600/500)');
  });
});
