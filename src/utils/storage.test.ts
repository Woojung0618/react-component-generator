import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProvider,
  saveProvider,
  loadApiKeys,
  saveApiKey,
  loadComponents,
  saveComponents,
} from './storage';
import type { GeneratedComponent } from '../types';

beforeEach(() => {
  localStorage.clear();
});

describe('provider persistence', () => {
  it('저장된 값이 없으면 null을 반환한다', () => {
    expect(loadProvider()).toBeNull();
  });

  it('저장한 provider를 그대로 불러온다', () => {
    saveProvider('anthropic');
    expect(loadProvider()).toBe('anthropic');
  });

  it('유효하지 않은 값이 저장되어 있으면 null을 반환한다', () => {
    localStorage.setItem('rcg:provider', 'invalid-provider');
    expect(loadProvider()).toBeNull();
  });
});

describe('apiKeys persistence', () => {
  it('저장된 값이 없으면 빈 객체를 반환한다', () => {
    expect(loadApiKeys()).toEqual({});
  });

  it('provider별로 키를 저장하고 불러온다', () => {
    saveApiKey('google', 'AIza-test');
    expect(loadApiKeys()).toEqual({ google: 'AIza-test' });
  });

  it('다른 provider의 키를 저장해도 기존 provider의 키는 유지된다', () => {
    saveApiKey('google', 'AIza-test');
    saveApiKey('anthropic', 'sk-ant-test');
    expect(loadApiKeys()).toEqual({ google: 'AIza-test', anthropic: 'sk-ant-test' });
  });

  it('손상된 JSON이 저장되어 있으면 빈 객체를 반환한다', () => {
    localStorage.setItem('rcg:apiKeys', '{not-json');
    expect(loadApiKeys()).toEqual({});
  });
});

describe('components persistence', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadComponents()).toEqual([]);
  });

  it('저장한 컴포넌트 목록을 createdAt이 Date 인스턴스인 상태로 불러온다', () => {
    const components: GeneratedComponent[] = [
      { id: '1', prompt: '프로필 카드', code: 'render(<div />)', createdAt: new Date('2026-01-01T00:00:00.000Z') },
    ];
    saveComponents(components);

    const loaded = loadComponents();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].createdAt).toBeInstanceOf(Date);
    expect(loaded[0].createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(loaded[0]).toMatchObject({ id: '1', prompt: '프로필 카드', code: 'render(<div />)' });
  });

  it('손상된 JSON이 저장되어 있으면 빈 배열을 반환한다', () => {
    localStorage.setItem('rcg:components', '{not-json');
    expect(loadComponents()).toEqual([]);
  });

  it('배열이 아닌 값이 저장되어 있으면 빈 배열을 반환한다', () => {
    localStorage.setItem('rcg:components', JSON.stringify({ not: 'an array' }));
    expect(loadComponents()).toEqual([]);
  });
});
