import { API_BASE_URL } from "./config";
import type { AnalysisResult, ExplainResult, Flag, QaResponse } from "./types";

const safeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const safeArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const normalizeSeverity = (value: unknown): Flag["severity"] => {
  if (value === "red" || value === "yellow" || value === "green") {
    return value;
  }
  return "yellow";
};

const postJson = async (path: string, payload: unknown) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Something went wrong.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // Fall back to generic message.
    }
    throw new Error(message);
  }

  return response.json();
};

export const analyzeLease = async (text: string): Promise<AnalysisResult> => {
  const data = (await postJson("/analyze", { text })) as Partial<AnalysisResult> & {
    flags?: Partial<Flag>[];
  };

  const flags = safeArray<Partial<Flag>>(data.flags).map((flag, index) => ({
    id: safeString(flag.id, `flag-${index}`),
    label: safeString(flag.label, "Unlabeled clause"),
    severity: normalizeSeverity(flag.severity),
    evidenceSnippet: safeString(flag.evidenceSnippet, ""),
    whyItMatters: safeString(flag.whyItMatters, ""),
  }));

  return {
    summaryBullets: safeArray<string>(data.summaryBullets).map((item) =>
      safeString(item, "")
    ),
    flags,
  };
};

export const explainClause = async (clause: string): Promise<ExplainResult> => {
  const data = (await postJson("/explain", { clause })) as Partial<ExplainResult>;

  return {
    explanation: safeString(data.explanation, ""),
    keyPoints: safeArray<string>(data.keyPoints).map((item) =>
      safeString(item, "")
    ),
    questionsToAsk: safeArray<string>(data.questionsToAsk).map((item) =>
      safeString(item, "")
    ),
  };
};

export const askQuestion = async (
  question: string,
  text: string
): Promise<QaResponse> => {
  const data = (await postJson("/qa", { question, text })) as Partial<QaResponse>;

  const confidence =
    data.confidence === "low" ||
    data.confidence === "medium" ||
    data.confidence === "high"
      ? data.confidence
      : "low";

  return {
    answer: safeString(data.answer, ""),
    confidence,
    basedOn: safeArray<string>(data.basedOn).map((item) => safeString(item, "")),
  };
};
