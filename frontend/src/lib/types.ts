export type FlagSeverity = "red" | "yellow" | "green";

export type Flag = {
  id: string;
  label: string;
  severity: FlagSeverity;
  evidenceSnippet: string;
  whyItMatters: string;
};

export type AnalysisResult = {
  summaryBullets: string[];
  flags: Flag[];
};

export type ExplainResult = {
  explanation: string;
  keyPoints: string[];
  questionsToAsk: string[];
};

export type QaResponse = {
  answer: string;
  confidence: "low" | "medium" | "high";
  basedOn: string[];
};

export type ExitListing = {
  id: string;
  created_at: string;
  user_id: string;
  city: string;
  state: string;
  neighborhood?: string | null;
  rent: number;
  deposit?: number | null;
  lease_end_date: string;
  earliest_move_in_date: string;
  beds_baths: string;
  housing_type: "apartment" | "house" | "townhouse" | "other";
  description: string;
  reason?: string | null;
  contact: string;
  status: "active" | "deleted";
};
