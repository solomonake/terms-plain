import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { explainHandler } from "./explain";

const createResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return res;
};

describe("explainHandler", () => {
  it("returns fallback response when GEMINI_API_KEY is missing", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const req = {
      body: {
        clause:
          "This lease automatically renews unless written notice 60 days before the end date.",
      },
    } as Request;

    const res = createResponse();

    await explainHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (
      res.json as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0][0] as {
      explanation: string;
      keyPoints: string[];
      questionsToAsk: string[];
    };

    expect(payload).toEqual({
      explanation:
        "This clause outlines the conditions under which the lease may be renewed or terminated. It typically requires written notice within a specific timeframe to avoid automatic renewal. Understanding these terms helps you plan your move-out timeline and avoid unintended lease extensions.",
      keyPoints: [
        "Written notice is required to terminate or avoid renewal.",
        "Notice must be provided within the specified timeframe (e.g., 30, 60, or 90 days).",
        "Failure to provide notice may result in automatic renewal for another term.",
      ],
      questionsToAsk: [
        "What is the exact notice period required in days?",
        "Does the notice need to be sent via certified mail or email?",
        "What happens if I miss the notice deadline?",
        "Is there a fee for breaking the lease early?",
      ],
    });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();

    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });
});
