import { describe, expect, it } from "vitest";
import { applyExplainPostValidation, extractBasedOnSnippets } from "./gemini";

describe("extractBasedOnSnippets", () => {
  it("returns snippet containing match keyword", () => {
    const text =
      "The tenant agrees to an Early termination fee of two months rent if leaving early.";
    const snippets = extractBasedOnSnippets(text, ["early termination fee"]);
    expect(snippets.length).toBeGreaterThan(0);
    expect(snippets[0].toLowerCase()).toContain("early termination fee");
    expect(snippets[0].length).toBeLessThanOrEqual(120);
  });
});

describe("applyExplainPostValidation", () => {
  it("replaces Not specified lists with deterministic content", () => {
    const result = applyExplainPostValidation(
      "Not specified in the text provided.",
      ["Not specified in the text provided."],
      ["Not specified in the text provided."]
    );

    expect(result.keyPoints).toEqual([
      "Lease renews automatically for 12 months unless you stop it.",
      "You must give written notice at least 60 days before the end date.",
      "Missing the deadline may renew your lease for another term.",
    ]);

    expect(result.questionsToAsk).toEqual([
      "How should I deliver written notice (email, mail, certified mail)?",
      "What happens if I miss the 60-day deadline?",
      "Will the renewal be month-to-month or a full 12-month term?",
    ]);
  });
});
