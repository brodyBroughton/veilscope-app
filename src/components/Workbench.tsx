// src/components/Workbench.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

export type Severity = "good" | "medium" | "bad";

export interface Factor {
  label: string;
  text: string;
  sev: Severity;
}

export interface CompanyLike {
  name: string;
  desc: string;
  ticker: string;
  score: number | null;
  factors: Factor[];
}

export type AnalysisFacts = {
  eps: unknown;
  cashflow: unknown;
  revenue: unknown;
};

type ChartDatum = {
  label: string;
  value: number;
  year?: number;
  quarter?: number;
};

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
  // Active ticker symbol for quotes
  activeTicker?: string | null;

  // The company data to display (summary + optional analysis)
  company: CompanyLike | null;

  facts?: AnalysisFacts | null;
  isFactsLoading?: boolean;

  // Called when user clicks "Run analysis"
  onRunAnalysis?: (ticker: string) => void;
};

const CHART_BAR_COLOR = "#EC4899";

const parseYear = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const match = value.match(/(20\d{2})/);
  return match ? Number(match[1]) : undefined;
};

const parseQuarter = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 1 && value <= 4) return value;
  }
  if (typeof value !== "string") return undefined;
  const match = value.match(/([1-4])/);
  return match ? Number(match[1]) : undefined;
};

const buildLabel = (quarter?: number, year?: number) => {
  if (quarter && year) return `Q${quarter} ${year}`;
  if (quarter) return `Q${quarter}`;
  if (year) return String(year);
  return "";
};

const extractSeries = (metricData: unknown, metricKey: string): ChartDatum[] => {
  const items: ChartDatum[] = [];

  if (Array.isArray(metricData)) {
    metricData.forEach((entry, index) => {
      if (!entry || typeof entry !== "object") return;
      const record = entry as Record<string, unknown>;
      const year = parseYear(
        record.year ?? record.fiscalYear ?? record.fiscal_year ?? record.date ?? record.period
      );
      const quarter = parseQuarter(record.quarter ?? record.q ?? record.period ?? record.label);
      const rawValue =
        record.value ?? record.amount ?? record[metricKey] ?? record.total ?? record.data;
      const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
      if (!Number.isFinite(value)) return;
      const label = buildLabel(quarter, year) || `Item ${index + 1}`;
      items.push({ label, value, year, quarter });
    });
  } else if (metricData && typeof metricData === "object") {
    Object.entries(metricData as Record<string, unknown>).forEach(([key, value]) => {
      const yearFromKey = parseYear(key);
      const quarterFromKey = parseQuarter(key);
      if (typeof value === "number") {
        const label = buildLabel(quarterFromKey, yearFromKey) || key;
        items.push({
          label,
          value,
          year: yearFromKey,
          quarter: quarterFromKey,
        });
        return;
      }
      if (value && typeof value === "object") {
        Object.entries(value as Record<string, unknown>).forEach(([innerKey, innerValue]) => {
          const year = yearFromKey ?? parseYear(innerKey);
          const quarter = quarterFromKey ?? parseQuarter(innerKey);
          const numericValue =
            typeof innerValue === "number" ? innerValue : Number(innerValue);
          if (!Number.isFinite(numericValue)) return;
          const label = buildLabel(quarter, year) || innerKey;
          items.push({
            label,
            value: numericValue,
            year,
            quarter,
          });
        });
      }
    });
  }

  return items.sort((a, b) => {
    const yearDiff = (a.year ?? 0) - (b.year ?? 0);
    if (yearDiff !== 0) return yearDiff;
    return (a.quarter ?? 0) - (b.quarter ?? 0);
  });
};

const BarChart = ({ title, data }: { title: string; data: ChartDatum[] }) => {
  const width = 360;
  const height = 220;
  const padding = { top: 24, right: 16, bottom: 36, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const safeMax = maxValue > 0 ? maxValue : 1;
  const band = chartWidth / Math.max(data.length, 1);
  const barWidth = band * 0.6;

  const ticks = Array.from({ length: 5 }, (_, i) => (safeMax / 4) * i);

  return (
    <div style={{ background: "#fff", padding: "16px", borderRadius: "12px" }}>
      <h3 style={{ marginBottom: "12px" }}>{title}</h3>
      {data.length === 0 ? (
        <p style={{ color: "#6B7280", fontSize: "14px" }}>
          No data available yet.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="220"
          role="img"
          aria-label={`${title} bar chart`}
        >
          {ticks.map((tick) => {
            const y =
              padding.top + chartHeight - (tick / safeMax) * chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fontSize="10"
                  fill="#6B7280"
                  textAnchor="end"
                >
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}
          {data.map((d, index) => {
            const x = padding.left + index * band + (band - barWidth) / 2;
            const barHeight = (d.value / safeMax) * chartHeight;
            const y = padding.top + chartHeight - barHeight;
            const parts = d.label.split(" ");
            return (
              <g key={`${d.label}-${index}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={CHART_BAR_COLOR}
                  rx={4}
                />
                <text
                  x={x + barWidth / 2}
                  y={padding.top + chartHeight + 16}
                  fontSize="10"
                  fill="#6B7280"
                  textAnchor="middle"
                >
                  {parts.length > 1 ? (
                    <>
                      <tspan x={x + barWidth / 2} dy="0">
                        {parts[0]}
                      </tspan>
                      <tspan x={x + barWidth / 2} dy="12">
                        {parts.slice(1).join(" ")}
                      </tspan>
                    </>
                  ) : (
                    d.label
                  )}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default function Workbench({
  activeTicker,
  company,
  facts,
  isFactsLoading,
  onRunAnalysis,
}: WorkbenchProps) {
  const ticker = (activeTicker ?? "").toUpperCase();

  const hasAnalysis =
    !!company &&
    typeof company.score === "number" &&
    Number.isFinite(company.score) &&
    company.factors.length > 0;

  const [quote, setQuote] = useState<Quote | null>(null);

  const chartSeries = useMemo(() => {
    if (!facts) {
      return {
        eps: [],
        cashflow: [],
        revenue: [],
      };
    }
    return {
      eps: extractSeries(facts.eps, "eps"),
      cashflow: extractSeries(facts.cashflow, "cashflow"),
      revenue: extractSeries(facts.revenue, "revenue"),
    };
  }, [facts]);

  const handleRunAnalysis = () => {
    if (onRunAnalysis && ticker) {
      onRunAnalysis(ticker);
    } else {
      console.log("Run analysis clicked for", ticker || "(no ticker)");
    }
  };

  // Placeholder quota values – later these can come from user/subscription data
  const analysesUsed = 1;
  const analysesLimit = 5;

  // Live quote for the side analytics panel
  useEffect(() => {
    if (!ticker) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quote?symbol=${encodeURIComponent(ticker)}`, {
          method: "GET",
          cache: "no-store",
        });

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
  }, [ticker]);

  if (!company) {
    return (
      <div className="workbench">
        <main className="pane-main" id="content" tabIndex={-1}>
          <h1 className="company">No company selected</h1>
          <p className="desc">
            Use the sidebar to search for a company by ticker or name.
          </p>
        </main>

        <aside className="pane-side" aria-label="Charts and live analytics">
          <section className="live-analytics" aria-label="Live market analytics">
            <h2 className="charts-title">Live analytics</h2>
            <p className="live-analytics-empty">
              Live market data is unavailable. No ticker selected.
            </p>
          </section>

          <h2 className="charts-title">Charts</h2>
          <div className="skeleton chart" />
          <div className="skeleton chart" />
        </aside>
      </div>
    );
  }

  return (
    <div className="workbench">
      <main className="pane-main" id="content" tabIndex={-1}>
        <h1 className="company">{company.ticker}</h1>
        {company.desc ? <p className="desc">{company.desc}</p> : null}

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
                    <strong>{f.label}:</strong> <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <section aria-label="No analysis yet" className="empty-scorecard">
            <h2 className="empty-scorecard-title">No analysis yet</h2>
            <p className="empty-scorecard-body">
              Run an analysis to generate a score and key factors for this company.
            </p>

            <button type="button" className="primary-cta" onClick={handleRunAnalysis}>
              Run analysis
            </button>

            <p className="empty-scorecard-quota">
              {analysesUsed}/{analysesLimit} analyses remaining this month
            </p>
          </section>
        )}
      </main>

      <aside className="pane-side" aria-label="Charts and live analytics">
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
                  {quote.change.toFixed(2)} ({quote.changePct >= 0 ? "+" : ""}
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

        <h2 className="charts-title">Charts</h2>
        {isFactsLoading ? (
          <>
            <div className="skeleton chart" />
            <div className="skeleton chart" />
            <div className="skeleton chart" />
          </>
        ) : facts ? (
          <div style={{ display: "grid", gap: "16px" }}>
            <BarChart title="EPS" data={chartSeries.eps} />
            <BarChart title="Cashflow" data={chartSeries.cashflow} />
            <BarChart title="Revenue" data={chartSeries.revenue} />
          </div>
        ) : (
          <>
            <div className="skeleton chart" />
            <div className="skeleton chart" />
          </>
        )}
      </aside>
    </div>
  );
}
