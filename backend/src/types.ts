export type FlagSeverity = "red" | "yellow" | "green";

export interface Flag {
  id: string;
  label: string;
  severity: FlagSeverity;
  evidenceSnippet: string;
  whyItMatters: string;
}

export interface AnalyzeResponse {
  summaryBullets: string[];
  flags: Flag[];
}

export interface ExplainResponse {
  explanation: string;
  keyPoints: string[];
  questionsToAsk: string[];
}

export interface QaResponse {
  answer: string;
  confidence: "low" | "medium" | "high";
  basedOn: string[];
}
