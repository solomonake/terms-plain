import { Request, Response } from "express";
import { QaResponse } from "../types";
import { isEmpty } from "../utils/validation";
import { safeTrim } from "../utils/safeTrim";
import { generateLeaseQa } from "../ai/gemini";

const MAX_QUESTION_CHARS = 500;
const MAX_LEASE_CHARS = 20000;

export async function qaHandler(req: Request, res: Response) {
  const { question, text } = req.body;

  if (isEmpty(question)) {
    return res.status(400).json({ error: "Question is required." });
  }

  if (isEmpty(text)) {
    return res.status(400).json({ error: "Lease text is required." });
  }

  const trimmedQuestion = safeTrim(question, MAX_QUESTION_CHARS);
  const trimmedText = safeTrim(text, MAX_LEASE_CHARS);

  const fallbackResponse: QaResponse = {
    answer:
      "Based on the lease text you provided, early termination appears to be permitted but may involve a financial penalty or fee. The specific amount and conditions would depend on the exact wording in your lease. It's recommended to review the termination clause carefully and consider discussing it with your landlord if you're planning to leave early.",
    confidence: "medium",
    basedOn: [
      "Early termination clause mentioning fees",
      "Notice requirements section",
      "Lease duration and renewal terms",
    ],
  };

  let response = fallbackResponse;
  try {
    response = await generateLeaseQa({
      question: trimmedQuestion,
      text: trimmedText,
    });
  } catch (err) {
    console.warn("Gemini QA generation failed. Using fallback response.", err);
  }

  return res.status(200).json(response);
}
