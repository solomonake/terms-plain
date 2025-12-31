import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { analyzeHandler } from "./analyze";

const createResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return res;
};

describe("analyzeHandler", () => {
  it("returns fallback summary when GEMINI_API_KEY is missing", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const req = {
      body: {
        text: "This lease automatically renews unless written notice 60 days before the end. An early termination fee applies if you terminate early.",
      },
    } as Request;

    const res = createResponse();

    await analyzeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (
      res.json as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0][0] as { summaryBullets: string[]; flags: unknown[] };

    expect(Array.isArray(payload.summaryBullets)).toBe(true);
    expect(payload.summaryBullets).toEqual([
      "Early termination may result in fees if you leave before the lease term ends.",
      "Automatic renewal applies unless you provide advance written notice.",
      "You may be responsible for minor repairs under a specified dollar amount.",
      "Security deposit return timelines and conditions are specified in your lease.",
    ]);
    expect(Array.isArray(payload.flags)).toBe(true);
    expect(payload.flags.length).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();

    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });
});
