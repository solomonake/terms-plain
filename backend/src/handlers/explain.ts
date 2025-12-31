import { Request, Response } from "express";
import { ExplainResponse } from "../types";
import { isEmpty } from "../utils/validation";
import { safeTrim } from "../utils/safeTrim";
import { generateExplainClause } from "../ai/gemini";

const MAX_CLAUSE_CHARS = 8000;

export async function explainHandler(req: Request, res: Response) {
  const { clause } = req.body;

  if (isEmpty(clause)) {
    return res.status(400).json({ error: "Clause text is required." });
  }

  const trimmedClause = safeTrim(clause, MAX_CLAUSE_CHARS);

  const fallbackResponse: ExplainResponse = {
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
  };

  let response = fallbackResponse;
  try {
    response = await generateExplainClause({ clause: trimmedClause });
  } catch (err) {
    console.warn(
      "Gemini explain generation failed. Using fallback response.",
      err
    );
  }

  return res.status(200).json(response);
}
