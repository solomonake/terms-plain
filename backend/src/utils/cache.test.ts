import { describe, expect, it, vi } from "vitest";
import { getCache, makeKey, setCache } from "./cache";

describe("cache", () => {
  it("set then get works", () => {
    const key = makeKey(["a", "b"]);
    setCache(key, { value: 123 }, 1000);
    expect(getCache<{ value: number }>(key)).toEqual({ value: 123 });
  });

  it("expires entries", () => {
    vi.useFakeTimers();
    const key = makeKey(["expire", "me"]);
    setCache(key, "hello", 10);

    expect(getCache<string>(key)).toBe("hello");
    vi.advanceTimersByTime(20);
    expect(getCache<string>(key)).toBeNull();

    vi.useRealTimers();
  });

  it("makes stable keys for same parts", () => {
    const keyA = makeKey(["same", "parts"]);
    const keyB = makeKey(["same", "parts"]);
    expect(keyA).toBe(keyB);
  });
});
