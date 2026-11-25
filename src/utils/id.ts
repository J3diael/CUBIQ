import { randomUUID } from 'expo-crypto';

/**
 * UUID v4 for every user-owned row. expo-crypto uses the platform's secure
 * random source on device; outside a native runtime (Node tests, some web
 * builds) it can be unavailable, so fall back to the standard Web Crypto API.
 */
export function newId(): string {
  const id = typeof randomUUID === 'function' ? randomUUID() : undefined;
  if (id) return id;
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (webCrypto?.randomUUID) return webCrypto.randomUUID();
  throw new Error('No secure UUID source available');
}
