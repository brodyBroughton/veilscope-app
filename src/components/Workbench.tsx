"use client";

import React, { useEffect, useState } from "react";
import { DATA, type Company } from "@/lib/data";

type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  asOf: string;
};

type WorkbenchProps = {
  activeKey: string;
  activeTicker?: string | null;
  onRunAnalysis?: (ticker: string) => void;
};

export default function Workbench({
  activeKey,
  activeTicker,
  onRunAnalysis,
}: WorkbenchProps) {
  // Fallback if activeKey isn't found
  const fallbackKey = Object.keys(DATA)[0];
  const company: Company = DATA[activeKey] ?? DATA[fallbackKey];

  // For now, treat "has analysis" as: numeric score + at least one factor
  const hasAnalysis =
    typeof company.score === "number" &&
    Number.isFinite(company.score) &&
    company.factors.length > 0;

  const [quote, setQuote] = useState<Quote | null>(null);

  const handleRunAnalysis = () => {
    if (onRunAnalysis) {
      onRunAnalysis(activeKey);
    } else {
      console.log("Run analysis clicked for", activeKey);
    }
  };

  // Placeholder quota values – later these can come from user/subscription data
  const analysesUsed = 1;
  const analysesLimit = 5;

  // Live quote for the side analytics panel
  useEffect(() => {
    if (!activeTicker) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchQuote = async () => {
      try {
        const res = await fetch(
          `/api/quote?symbol=${encodeURIComponent(activeTicker)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!res.ok) {
          if (!cancelled) setQuote(null);
          return;
        }

        const data = (await res.json()) as Quote;
        if (!cancelled) {
          setQuote(data);
        }
      } catch {
        if (!cancelled) {
          setQuote(null);
        }
      }
    };

    // initial fetch
    fetchQuote();

    // poll every 10 seconds
    intervalId = setInterval(fetchQuote, 10_000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTicker]);

  return (
    <div className="workbench">
      <main className="pane-main" id="content" tabIndex={-1}>
        <h1 className="company">{company.name}</h1>
        <p className="desc">{company.desc}</p>

        {hasAnalysis ? (
          <>
            <div className="score">
              Score: <strong>{company.score}/100</strong>
            </div>

            <section aria-labelledby="factors-title" className="factors">
              <h2 id="factors-title" className="sr-only">
                Risk Factors
              </h2>
              <ul className="factor-list" role="list">
                {company.factors.map((f, i) => (
                  <li key={i}>
                    <span className={`dot ${f.sev}`}></span>
                    <strong>{f.label}:</strong>{" "}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          // Empty-state / "no analysis yet" card
          <section
            aria-label="No analysis yet"
            className="empty-scorecard"
          >
            <h2 className="empty-scorecard-title">No analysis yet</h2>
            <p className="empty-scorecard-body">
              Run an analysis to generate a score and key factors for this company.
            </p>

            <button
              type="button"
              className="primary-cta"
              onClick={handleRunAnalysis}
            >
              Run analysis
            </button>

            <p className="empty-scorecard-quota">
              {analysesUsed}/{analysesLimit} analyses remaining this month
            </p>
          </section>
        )}
      </main>

      <aside className="pane-side" aria-label="Charts and live analytics">
        {/* 🔹 New live analytics block */}
        <section className="live-analytics" aria-label="Live market analytics">
          <h2 className="charts-title">Live analytics</h2>

          {quote ? (
            <dl className="live-analytics-grid">
              <div className="metric">
                <dt>Last</dt>
                <dd>${quote.price.toFixed(2)}</dd>
              </div>
              <div className="metric">
                <dt>Change</dt>
                <dd className={quote.changePct >= 0 ? "pos" : "neg"}>
                  {quote.change >= 0 ? "+" : ""}
                  {quote.change.toFixed(2)}{" "}
                  ({quote.changePct >= 0 ? "+" : ""}
                  {quote.changePct.toFixed(2)}%)
                </dd>
              </div>
              <div className="metric">
                <dt>High</dt>
                <dd>${quote.high.toFixed(2)}</dd>
              </div>
              <div className="metric">
                <dt>Low</dt>
                <dd>${quote.low.toFixed(2)}</dd>
              </div>
              <div className="metric">
                <dt>Open</dt>
                <dd>${quote.open.toFixed(2)}</dd>
              </div>
              <div className="metric">
                <dt>Prev close</dt>
                <dd>${quote.prevClose.toFixed(2)}</dd>
              </div>
            </dl>
          ) : (
            <p className="live-analytics-empty">
              Live market data is unavailable for this ticker.
            </p>
          )}
        </section>

        {/* Existing charts section */}
        <h2 className="charts-title">Charts</h2>
        <div className="skeleton chart" />
        <div className="skeleton chart" />
      </aside>
    </div>
  );
}