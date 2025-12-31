import type { AnalysisResult, ExplainResult, QaResponse } from "./types";

export const mockAnalysisResult: AnalysisResult = {
  summaryBullets: [
    "Early termination fee applies if you leave before month 10.",
    "Automatic renewal kicks in unless you give 60 days notice.",
    "Repairs under $150 are your responsibility.",
  ],
  flags: [
    {
      id: "flag-termination",
      label: "Early termination penalty",
      severity: "red",
      evidenceSnippet:
        "Tenant agrees to pay a fee equal to two months' rent if the lease is ended early.",
      whyItMatters:
        "Leaving early could cost you thousands even if you give notice.",
    },
    {
      id: "flag-renewal",
      label: "Automatic renewal",
      severity: "yellow",
      evidenceSnippet:
        "This lease renews for 12 months unless Tenant provides 60 days notice.",
      whyItMatters:
        "You might get locked into another year if you miss the deadline.",
    },
    {
      id: "flag-repairs",
      label: "Small repairs clause",
      severity: "green",
      evidenceSnippet:
        "Tenant covers repairs under $150; landlord covers major systems.",
      whyItMatters:
        "Normal wear is likely covered, but small fixes are on you.",
    },
  ],
};

export const mockExplainResult: ExplainResult = {
  explanation:
    "This clause says you must give written notice at least 60 days before the lease ends. If you don't, your lease renews automatically for another full term.",
  keyPoints: [
    "Notice must be in writing.",
    "The deadline is 60 days before the end date.",
    "Missing the deadline triggers automatic renewal.",
  ],
  questionsToAsk: [
    "Where should I send the written notice?",
    "Will email count as written notice?",
    "Is there any flexibility on the 60-day requirement?",
  ],
};

export const mockQaResponse: QaResponse = {
  answer:
    "Based on your lease, you can leave early but you'll need to pay a termination fee equal to two months' rent. This applies if you leave before month 10. Make sure to give proper written notice as specified in your lease to avoid additional penalties.",
  confidence: "high",
  basedOn: [
    "Early termination penalty clause",
    "Notice requirements section",
  ],
};
