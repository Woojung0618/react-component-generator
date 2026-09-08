import type { GeneratedComponent, Provider } from '../types';

const STORAGE_KEYS = {
  provider: 'rcg:provider',
  apiKeys: 'rcg:apiKeys',
  components: 'rcg:components',
} as const;

function isProvider(value: unknown): value is Provider {
  return value === 'anthropic' || value === 'google';
}

export function loadProvider(): Provider | null {
  const raw = localStorage.getItem(STORAGE_KEYS.provider);
  return isProvider(raw) ? raw : null;
}

export function saveProvider(provider: Provider): void {
  localStorage.setItem(STORAGE_KEYS.provider, provider);
}

export function loadApiKeys(): Partial<Record<Provider, string>> {
  const raw = localStorage.getItem(STORAGE_KEYS.apiKeys);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveApiKey(provider: Provider, key: string): void {
  const keys = loadApiKeys();
  localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify({ ...keys, [provider]: key }));
}

export function loadComponents(): GeneratedComponent[] {
  const raw = localStorage.getItem(STORAGE_KEYS.components);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }));
  } catch {
    return [];
  }
}

export function saveComponents(components: GeneratedComponent[]): void {
  localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(components));
}
