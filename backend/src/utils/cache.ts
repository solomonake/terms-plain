import crypto from "crypto";

const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new Map<string, { value: unknown; expiresAt: number }>();

export const makeKey = (parts: string[]): string => {
  const joined = parts.join("||");
  return crypto.createHash("sha256").update(joined).digest("hex").slice(0, 32);
};

export const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
};

export const setCache = <T>(key: string, value: T, ttlMs = CACHE_TTL_MS) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export { CACHE_TTL_MS };
