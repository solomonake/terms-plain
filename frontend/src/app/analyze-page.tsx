"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { AnalysisResult, Flag, QaResponse } from "@/lib/types";
import { analyzeLease, askQuestion } from "@/lib/api";
import { SAMPLE_LATE_FEE_CLAUSE, SAMPLE_LEASE_TEXT } from "@/lib/samples";
import { trackEvent } from "@/lib/analytics";

const FlagCard = ({ flag }: { flag: Flag }) => {
  return (
    <div className="flag-card">
      <span className={`flag-pill ${flag.severity}`}>
        {flag.severity.toUpperCase()} FLAG
      </span>
      <strong>{flag.label}</strong>
      <p className="flag-meta">Severity: {flag.severity}</p>
      <p className="flag-meta">{flag.evidenceSnippet}</p>
      <p className="muted">Here’s what your lease says</p>
      <p>{flag.whyItMatters}</p>
    </div>
  );
};

export default function AnalyzePage() {
  const [leaseText, setLeaseText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [apiError, setApiError] = useState("");

  const [question, setQuestion] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [qaResponse, setQaResponse] = useState<QaResponse | null>(null);
  const analyzeTrackedRef = useRef(false);
  const qaTrackedRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!leaseText.trim()) {
      setError("Please paste your lease text.");
      setResult(null);
      return;
    }

    setError("");
    setApiError("");
    setIsLoading(true);
    setResult(null);
    try {
      const data = await analyzeLease(leaseText);
      setResult(data);
      setQaResponse(null);
      setQuestionError("");
      if (!analyzeTrackedRef.current) {
        analyzeTrackedRef.current = true;
        void trackEvent({ type: "lease_analyzed" });
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "We couldn’t analyze your lease.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!leaseText.trim()) {
      setQuestionError("Please paste lease text before asking a question.");
      return;
    }
    if (!question.trim()) {
      setQuestionError("Please enter a question.");
      return;
    }

    setQuestionError("");
    setIsQuestionLoading(true);
    setQaResponse(null);
    try {
      const data = await askQuestion(question, leaseText);
      setQaResponse(data);
      if (!qaTrackedRef.current) {
        qaTrackedRef.current = true;
        void trackEvent({ type: "question_asked" });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setQuestionError(message);
    } finally {
      setIsQuestionLoading(false);
    }
  };

  return (
    <div className="section">
      <section className="lease-preview" aria-labelledby="lease-heading">
        <h1 id="lease-heading">See what a lease could cost you</h1>
        <p>For renters who want to check fees against the fine print.</p>
        <figure className="lease-note">
          <figcaption>Sample lease · Clause 3 · Late fees</figcaption>
          <blockquote>{SAMPLE_LATE_FEE_CLAUSE}</blockquote>
          <div className="lease-finding">
            <strong>Late fee charges</strong>
            <p>If your rent hasn’t arrived by the 5th, this clause adds $75 plus $10 per day.</p>
          </div>
        </figure>
        <a className="button" href="#lease-text">Check my lease</a>
      </section>
      <h2>Analyze your lease</h2>
      <form className="form card" onSubmit={handleSubmit}>
        <div className="section">
          <label htmlFor="lease-text">Paste your lease text</label>
          <textarea
            id="lease-text"
            className="textarea-large"
            placeholder="Paste the full lease or the section you want analyzed..."
            value={leaseText}
            onChange={(event) => setLeaseText(event.target.value)}
          />
          <button
            className="button-secondary"
            type="button"
            onClick={() => {
              setLeaseText(SAMPLE_LEASE_TEXT);
              setError("");
            }}
          >
            Use sample text
          </button>
          {error ? <p className="error">{error}</p> : null}
        </div>
        <p className="disclaimer">For information only. This is not legal advice.</p>
        <button className="button" type="submit" disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Analyze Lease"}
        </button>
      </form>

      {apiError ? (
        <div className="card error-banner">
          <strong>{apiError}</strong>
          <br />
          <small>
            Your text is still here. Try analyzing it again.
          </small>
        </div>
      ) : null}

      {result ? (
        <div className="section card">
          <div className="section">
            <h3>What we found in your lease</h3>
            <p className="muted">Based only on the text you pasted</p>
            {!leaseText.trim() || result.summaryBullets.length === 0 ? (
              <div className="card">
                <strong>No summary yet</strong>
                <p>Paste your lease text and tap Analyze.</p>
              </div>
            ) : (
              <ul className="summary-list">
                {result.summaryBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <p className="disclaimer">
              This is for information, not legal advice
            </p>
          </div>

          <div className="section">
            <h3>Flags</h3>
            <div className="flag-list">
              {result.flags.map((flag) => (
                <FlagCard key={flag.id} flag={flag} />
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Ask a question</h3>
            {!leaseText.trim() ? (
              <p className="disclaimer">
                Paste lease text first so we can answer based on it.
              </p>
            ) : (
              <form className="form" onSubmit={handleQuestionSubmit}>
                <div className="section">
                  <label htmlFor="question-text">
                    Ask a question about your lease
                  </label>
                  <textarea
                    id="question-text"
                    placeholder="Example: Can I leave early? What happens if I'm late on rent?"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={!leaseText.trim()}
                  />
                  {questionError ? (
                    <p className="error">{questionError}</p>
                  ) : null}
                  <p className="disclaimer">
                    Answers are based only on the text you provided.
                    Informational only, not legal advice.
                  </p>
                </div>
                <button
                  className="button"
                  type="submit"
                  disabled={isQuestionLoading || !leaseText.trim()}
                >
                  {isQuestionLoading ? "Thinking…" : "Ask"}
                </button>
              </form>
            )}

            {qaResponse ? (
              <div className="card" style={{ marginTop: "16px" }}>
                <div className="section">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <strong>Answer</strong>
                    <span
                      className={`flag-pill ${
                        qaResponse.confidence === "high"
                          ? "green"
                          : qaResponse.confidence === "medium"
                          ? "yellow"
                          : "red"
                      }`}
                    >
                      {qaResponse.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                  <p>{qaResponse.answer}</p>
                  <p className="disclaimer">
                    This is for information, not legal advice
                  </p>
                  <div className="section" style={{ marginTop: "12px" }}>
                    <p className="flag-meta">Where this comes from</p>
                    {qaResponse.basedOn.length === 0 ||
                    qaResponse.basedOn.every(
                      (item) => item === "Not specified in the text provided."
                    ) ? (
                      <div className="card">
                        <strong>We didn’t find this in your lease</strong>
                        <p>
                          Try pasting the full section (termination, renewal,
                          fees) and ask again.
                        </p>
                      </div>
                    ) : (
                      <ul className="bullet-list">
                        {qaResponse.basedOn.map((source, index) => (
                          <li key={index}>{source}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="section">
            <h3>Explain a clause</h3>
            <Link className="inline-link" href="/explain">
              Explain a clause
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
