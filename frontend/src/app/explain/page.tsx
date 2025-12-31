"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ExplainResult } from "@/lib/types";
import { explainClause } from "@/lib/api";
import { SAMPLE_CLAUSE_TEXT } from "@/lib/samples";
import { trackEvent } from "@/lib/analytics";

export default function ExplainPage() {
  const [clauseText, setClauseText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [apiError, setApiError] = useState("");
  const explainTrackedRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clauseText.trim()) {
      setError("Please paste a clause to explain.");
      setResult(null);
      return;
    }

    setError("");
    setApiError("");
    setIsLoading(true);
    setResult(null);
    try {
      const data = await explainClause(clauseText);
      setResult(data);
      if (!explainTrackedRef.current) {
        explainTrackedRef.current = true;
        void trackEvent({ type: "clause_explained" });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section">
      <h2>Explain a Clause</h2>
      <form className="form card" onSubmit={handleSubmit}>
        <div className="section">
          <label htmlFor="clause-text">Paste the clause you want explained</label>
          <textarea
            id="clause-text"
            placeholder="Paste the clause here..."
            value={clauseText}
            onChange={(event) => setClauseText(event.target.value)}
          />
          <button
            className="button-secondary"
            type="button"
            onClick={() => {
              setClauseText(SAMPLE_CLAUSE_TEXT);
              setError("");
            }}
          >
            Use sample text
          </button>
          {error ? <p className="error">{error}</p> : null}
        </div>
        <button className="button" type="submit" disabled={isLoading}>
          {isLoading ? "Explaining..." : "Explain Clause"}
        </button>
      </form>

      {apiError ? (
        <div className="card error-banner">
          <strong>{apiError}</strong>
          <br />
          <small>
            Make sure the backend is running on http://localhost:4000
          </small>
        </div>
      ) : null}

      {!clauseText.trim() && !result ? (
        <div className="card">
          <strong>No clause yet</strong>
          <p>Paste a clause and tap Explain.</p>
        </div>
      ) : null}

      {result ? (
        <div className="section card">
          <div className="section">
            <h3>Here's what this clause means</h3>
            <p className="muted">Based only on the clause you pasted</p>
            <p>{result.explanation}</p>
            <p className="disclaimer">
              This is for information, not legal advice
            </p>
          </div>
          <div className="section">
            <h3>Key points</h3>
            {result.keyPoints.length > 0 ? (
              <ul className="bullet-list">
                {result.keyPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>Paste more text for a better answer</p>
            )}
          </div>
          <div className="section">
            <h3>Questions to ask</h3>
            {result.questionsToAsk.length > 0 ? (
              <ul className="bullet-list">
                {result.questionsToAsk.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>Paste more text for a better answer</p>
            )}
            <p className="disclaimer">
              This is for information, not legal advice
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
