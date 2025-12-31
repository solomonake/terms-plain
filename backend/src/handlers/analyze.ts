import { Request, Response } from "express";
import { AnalyzeResponse } from "../types";
import { isEmpty } from "../utils/validation";
import { safeTrim } from "../utils/safeTrim";
import { detectFlags } from "../detectFlags";
import { generateAnalyzeSummary } from "../ai/gemini";

const MAX_LEASE_CHARS = 20000;

export async function analyzeHandler(req: Request, res: Response) {
  const { text } = req.body;

  if (isEmpty(text)) {
    return res.status(400).json({ error: "Lease text is required." });
  }

  const trimmedText = safeTrim(text, MAX_LEASE_CHARS);

  const flags = detectFlags(trimmedText);

  const fallbackSummaryBullets = [
    "Early termination may result in fees if you leave before the lease term ends.",
    "Automatic renewal applies unless you provide advance written notice.",
    "You may be responsible for minor repairs under a specified dollar amount.",
    "Security deposit return timelines and conditions are specified in your lease.",
  ];

  let summaryBullets = fallbackSummaryBullets;
  try {
    summaryBullets = await generateAnalyzeSummary({
      text: trimmedText,
      flags,
    });
    console.log("Gemini summary OK (bullets):", summaryBullets.length);
  } catch (err) {
    console.warn(
      "Gemini summary generation failed. Using fallback bullets.",
      err
    );
  }

  const response: AnalyzeResponse = {
    summaryBullets,
    flags,
  };

  return res.status(200).json(response);
}
