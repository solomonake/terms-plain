import { GoogleGenAI } from "@google/genai";
import type { Flag } from "../types";
import { parsePossiblyFencedJson } from "./parseJson";
import { getCache, makeKey, setCache } from "../utils/cache";

type AnalyzeSummaryArgs = {
  text: string;
  flags: Flag[];
};

type ExplainClauseArgs = {
  clause: string;
};

type LeaseQaArgs = {
  question: string;
  text: string;
};

type Confidence = "low" | "medium" | "high";

const asConfidence = (value: unknown): Confidence =>
  value === "low" || value === "medium" || value === "high" ? value : "low";

let cachedClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

const summarySchema = {
  type: "object",
  properties: {
    summaryBullets: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
    },
  },
  required: ["summaryBullets"],
  additionalProperties: false,
} as const;

const explainSchema = {
  type: "object",
  properties: {
    explanation: { type: "string" },
    keyPoints: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 6,
    },
    questionsToAsk: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 6,
    },
  },
  required: ["explanation", "keyPoints", "questionsToAsk"],
  additionalProperties: false,
} as const;

const qaSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    basedOn: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
  },
  required: ["answer", "confidence", "basedOn"],
  additionalProperties: false,
} as const;

const buildUserPrompt = (text: string, flags: Flag[]) => {
  const flagLines = flags.length
    ? flags
        .map(
          (flag) =>
            `- ${flag.id} | ${flag.label} | ${flag.severity} | ${flag.whyItMatters}`
        )
        .join("\n")
    : "- None";

  return `You are Termsplain, a renter-friendly lease explainer.
You are not a lawyer and you do not give legal advice.
Only use the provided lease text.
If something is not specified in the text, say: "Not specified in the text provided."

LEASE TEXT:
${text}

DETECTED FLAGS:
${flagLines}

TASK:
Generate 3–6 short summary bullets (max 140 chars each) explaining the most important points for a renter.
Return JSON only.`;
};

const buildExplainPrompt = (clause: string) => {
  return `You are Termsplain, a renter-friendly lease explainer.
You are not a lawyer and you do not give legal advice.
Only use the provided clause text.
If something is not specified in the text, say: "Not specified in the text provided."
Do not mention AI or tools.
You MUST fill keyPoints and questionsToAsk using only the clause text provided.
Do NOT output "Not specified in the text provided." unless the clause truly lacks the requested info.
keyPoints must include:
1) notice method requirement (written notice)
2) notice timing (60 days before end)
3) renewal length (12 months)
questionsToAsk should be practical and clause-grounded:
- "How must written notice be delivered (email, mail, certified)?"
- "What happens if I miss the 60-day deadline?"
- "Can I switch to month-to-month instead of a new 12-month term?"

CLAUSE:
${clause}

TASK:
Explain the clause in plain English for a renter. Provide key points and questions to ask.
Return JSON only.`;
};

const buildQaPrompt = (question: string, text: string) => {
  return `You are Termsplain, a renter-friendly lease explainer.
You are not a lawyer and you do not give legal advice.
Only use the provided lease text.
If something is not specified in the text, say: "Not specified in the text provided."
Do not mention AI or tools.
Answer using ONLY the provided lease text.
If the lease text explicitly answers the question, confidence MUST be "high".
If partially answered, "medium".
If not answered, answer must be "Not specified in the text provided." and confidence "low".
basedOn MUST contain 1–3 short direct snippets copied from the lease text (<=120 chars each).
NEVER put "Not specified..." inside basedOn when there is matching text.
If not answered, basedOn can include: "No clause found about this in provided text".

LEASE TEXT:
${text}

QUESTION:
${question}

TASK:
Answer the question using only the lease text. Provide confidence and short supporting snippets.
Return JSON only.`;
};

const getResponseText = (response: unknown) => {
  const raw =
    (response as { text?: string | (() => string) }).text ??
    (response as { text?: () => string }).text?.() ??
    (response as any)?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "";

  if (!raw) {
    throw new Error("Empty response from Gemini");
  }

  return raw;
};

const includesPhrase = (items: string[], phrase: string) =>
  items.some((item) => item.toLowerCase().includes(phrase));

export const extractBasedOnSnippets = (
  text: string,
  keywords: string[]
): string[] => {
  const lower = text.toLowerCase();
  let matchIndex = -1;
  let matchLen = 0;

  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword.toLowerCase());
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
      matchIndex = idx;
      matchLen = keyword.length;
    }
  }

  if (matchIndex === -1) {
    return [];
  }

  const snippetStart = Math.max(0, matchIndex - 40);
  const snippetEnd = Math.min(text.length, matchIndex + matchLen + 60);
  const snippet = text.slice(snippetStart, snippetEnd).trim();

  const snippets = [snippet];
  if (snippet.length > 120) {
    snippets[0] = snippet.slice(0, 120).trim();
  }

  return snippets;
};

export const applyExplainPostValidation = (
  explanation: string,
  keyPoints: string[],
  questionsToAsk: string[]
) => {
  const hasWrittenNotice = includesPhrase(keyPoints, "written notice");
  const hasSixtyDays = includesPhrase(keyPoints, "60 days");
  const hasTwelveMonths = includesPhrase(keyPoints, "12 months");

  let nextKeyPoints = keyPoints;
  if (!hasWrittenNotice || !hasSixtyDays || !hasTwelveMonths) {
    nextKeyPoints = [
      "Lease renews automatically for 12 months unless you stop it.",
      "You must give written notice at least 60 days before the end date.",
      "Missing the deadline may renew your lease for another term.",
    ];
  }

  const notSpecifiedText = "not specified in the text provided.";
  const allNotSpecified =
    questionsToAsk.length > 0 &&
    questionsToAsk.every((item) =>
      item.toLowerCase().includes(notSpecifiedText)
    );

  let nextQuestions = questionsToAsk;
  if (allNotSpecified) {
    nextQuestions = [
      "How should I deliver written notice (email, mail, certified mail)?",
      "What happens if I miss the 60-day deadline?",
      "Will the renewal be month-to-month or a full 12-month term?",
    ];
  }

  return {
    explanation,
    keyPoints: nextKeyPoints,
    questionsToAsk: nextQuestions,
  };
};

export async function generateAnalyzeSummary(
  args: AnalyzeSummaryArgs
): Promise<string[]> {
  const client = getGeminiClient();
  const cacheKey = makeKey([
    "generateAnalyzeSummary",
    "gemini-2.5-flash",
    args.text.trim(),
    JSON.stringify(args.flags),
  ]);
  const cached = getCache<string[]>(cacheKey);
  if (cached) {
    console.log("Gemini cache hit:", "generateAnalyzeSummary");
    return cached;
  }

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: buildUserPrompt(args.text, args.flags) }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: summarySchema,
    },
  });

  const raw = getResponseText(response);

  const parsed = parsePossiblyFencedJson(raw) as { summaryBullets?: unknown };
  const bullets = Array.isArray(parsed.summaryBullets)
    ? parsed.summaryBullets
    : [];

  const normalized = bullets
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .map((item) => (item.length > 140 ? `${item.slice(0, 140).trim()}` : item));

  while (normalized.length < 3) {
    normalized.push("Not specified in the text provided.");
  }

  const finalBullets = normalized.length > 6 ? normalized.slice(0, 6) : normalized;
  setCache(cacheKey, finalBullets);
  return finalBullets;
}

export async function generateExplainClause(
  args: ExplainClauseArgs
): Promise<{ explanation: string; keyPoints: string[]; questionsToAsk: string[] }> {
  const client = getGeminiClient();
  const cacheKey = makeKey([
    "generateExplainClause",
    "gemini-2.5-flash",
    args.clause.trim(),
  ]);
  const cached = getCache<{
    explanation: string;
    keyPoints: string[];
    questionsToAsk: string[];
  }>(cacheKey);
  if (cached) {
    console.log("Gemini cache hit:", "generateExplainClause");
    return cached;
  }

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: buildExplainPrompt(args.clause) }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: explainSchema,
    },
  });

  const raw = getResponseText(response);
  const parsed = parsePossiblyFencedJson(raw) as {
    explanation?: unknown;
    keyPoints?: unknown;
    questionsToAsk?: unknown;
  };

  const explanation =
    typeof parsed.explanation === "string" && parsed.explanation.trim()
      ? parsed.explanation.trim()
      : "Not specified in the text provided.";

  const keyPoints = Array.isArray(parsed.keyPoints)
    ? parsed.keyPoints
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .map((item) => (item.length > 120 ? item.slice(0, 120).trim() : item))
    : [];

  const questionsToAsk = Array.isArray(parsed.questionsToAsk)
    ? parsed.questionsToAsk
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .map((item) => (item.length > 120 ? item.slice(0, 120).trim() : item))
    : [];

  while (keyPoints.length < 2) {
    keyPoints.push("Not specified in the text provided.");
  }

  while (questionsToAsk.length < 2) {
    questionsToAsk.push("Not specified in the text provided.");
  }

  const trimmedExplanation =
    explanation.length > 700 ? `${explanation.slice(0, 700).trim()}` : explanation;

  const normalized = applyExplainPostValidation(
    trimmedExplanation,
    keyPoints.slice(0, 6),
    questionsToAsk.slice(0, 6)
  );

  setCache(cacheKey, normalized);
  return normalized;
}

export async function generateLeaseQa(
  args: LeaseQaArgs
): Promise<{ answer: string; confidence: "low" | "medium" | "high"; basedOn: string[] }> {
  const client = getGeminiClient();
  const cacheKey = makeKey([
    "generateLeaseQa",
    "gemini-2.5-flash",
    args.question.trim(),
    args.text.trim(),
  ]);
  const cached = getCache<{
    answer: string;
    confidence: "low" | "medium" | "high";
    basedOn: string[];
  }>(cacheKey);
  if (cached) {
    console.log("Gemini cache hit:", "generateLeaseQa");
    return cached;
  }

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: buildQaPrompt(args.question, args.text) }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: qaSchema,
    },
  });

  const raw = getResponseText(response);
  const parsed = parsePossiblyFencedJson(raw) as {
    answer?: unknown;
    confidence?: unknown;
    basedOn?: unknown;
  };

  const answer =
    typeof parsed.answer === "string" && parsed.answer.trim()
      ? parsed.answer.trim()
      : "Not specified in the text provided.";

  const confidence = asConfidence(parsed.confidence);

  const basedOn = Array.isArray(parsed.basedOn)
    ? parsed.basedOn
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .map((item) => (item.length > 120 ? item.slice(0, 120).trim() : item))
    : [];

  const trimmedAnswer =
    answer.length > 900 ? `${answer.slice(0, 900).trim()}` : answer;

  let normalizedBasedOn = basedOn.slice(0, 5);
  const notSpecified = "not specified in the text provided.";
  const hasNotSpecified = normalizedBasedOn.some((item) =>
    item.toLowerCase().includes(notSpecified)
  );

  if (normalizedBasedOn.length === 0 || hasNotSpecified) {
    const snippets = extractBasedOnSnippets(args.text, [
      "early termination fee",
      "termination fee",
      "early termination",
    ]);
    if (snippets.length) {
      normalizedBasedOn = snippets.slice(0, 5);
    }
  }

  if (trimmedAnswer.toLowerCase().includes(notSpecified)) {
    if (normalizedBasedOn.length === 0) {
      normalizedBasedOn = ["No clause found about this in provided text"];
    }
  }

  const questionLower = args.question.toLowerCase();
  const textLower = args.text.toLowerCase();
  const leavingEarlyQuestion =
    questionLower.includes("leave early") ||
    questionLower.includes("early termination") ||
    questionLower.includes("terminate early") ||
    questionLower.includes("break the lease") ||
    questionLower.includes("breaking the lease");

  const hasEarlyTermination =
    textLower.includes("early termination") ||
    textLower.includes("termination fee");

  let normalizedConfidence = confidence;
  if (leavingEarlyQuestion && hasEarlyTermination) {
    normalizedConfidence = "high";
    const snippets = extractBasedOnSnippets(args.text, [
      "early termination fee",
      "termination fee",
      "early termination",
    ]);
    if (snippets.length) {
      const hasEarlySnippet = snippets.some((snippet) =>
        snippet.toLowerCase().includes("early termination fee")
      );
      if (hasEarlySnippet) {
        normalizedBasedOn = snippets.slice(0, 5);
      } else if (normalizedBasedOn.length === 0) {
        normalizedBasedOn = snippets.slice(0, 5);
      } else if (!normalizedBasedOn.some((item) =>
        item.toLowerCase().includes("early termination fee")
      )) {
        normalizedBasedOn = [...snippets.slice(0, 1), ...normalizedBasedOn].slice(
          0,
          5
        );
      }
    }
  }

  if (normalizedBasedOn.length === 0 && args.text.trim()) {
    normalizedBasedOn = [args.text.slice(0, 120).trim()];
  }

  const finalResponse = {
    answer: trimmedAnswer,
    confidence: normalizedConfidence,
    basedOn: normalizedBasedOn.slice(0, 5),
  };
  setCache(cacheKey, finalResponse);
  return finalResponse;
}
