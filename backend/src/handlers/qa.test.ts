import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { qaHandler } from "./qa";

const createResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return res;
};

describe("qaHandler", () => {
  it("returns fallback response when GEMINI_API_KEY is missing", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const req = {
      body: {
        question: "Can I leave early?",
        text: "This lease includes an early termination fee of two months rent.",
      },
    } as Request;

    const res = createResponse();

    await qaHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (
      res.json as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0][0] as {
      answer: string;
      confidence: string;
      basedOn: string[];
    };

    expect(payload).toEqual({
      answer:
        "Based on the lease text you provided, early termination appears to be permitted but may involve a financial penalty or fee. The specific amount and conditions would depend on the exact wording in your lease. It's recommended to review the termination clause carefully and consider discussing it with your landlord if you're planning to leave early.",
      confidence: "medium",
      basedOn: [
        "Early termination clause mentioning fees",
        "Notice requirements section",
        "Lease duration and renewal terms",
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
