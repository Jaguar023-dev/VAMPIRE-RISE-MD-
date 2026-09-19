export type ProviderType =
  | 'ai' | 'music' | 'downloader' | 'search' | 'news'
  | 'weather' | 'sports' | 'image' | 'video' | 'translation';

export interface Provider {
  id: string;
  type: ProviderType;
  name: string;
  enabled: boolean;
  run: (input: any, opts?: any) => Promise<any>;
}

const registry = new Map<string, Provider>();

export function addProvider(p: Provider) {
  registry.set(p.id, p);
}

export function getProviders(type?: ProviderType): Provider[] {
  const list = Array.from(registry.values()).filter((p) => p.enabled);
  return type ? list.filter((p) => p.type === type) : list;
}

export function getProvider(id: string): Provider | undefined {
  return registry.get(id);
}

export function removeProvider(id: string) {
  registry.delete(id);
}

export function setProviderEnabled(id: string, enabled: boolean) {
  const p = registry.get(id);
  if (p) p.enabled = enabled;
}

/** Run first enabled provider of a type; falls back on failure. */
export async function runFirst(type: ProviderType, input: any, opts?: any) {
  const list = getProviders(type);
  let lastErr: any;
  for (const p of list) {
    try {
      return { provider: p.id, result: await p.run(input, opts) };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error(`No ${type} provider available.`);
}