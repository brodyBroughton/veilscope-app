// Workbench.tsx
import { DATA, type Company } from "@/lib/data";

type WorkbenchProps = {
  activeKey: string;
  onRunAnalysis?: (ticker: string) => void;
};

export default function Workbench({ activeKey, onRunAnalysis }: WorkbenchProps) {
  const company: Company = DATA[activeKey] ?? DATA.SAMPLE;

  // For now, treat "has analysis" as: numeric score + at least one factor
  const hasAnalysis =
    typeof company.score === "number" &&
    Number.isFinite(company.score) &&
    company.factors.length > 0;

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
              {/* Placeholder quota text – wire this to real data later */}
              {analysesUsed}/{analysesLimit} analyses remaining this month
            </p>
          </section>
        )}
      </main>

      <aside className="pane-side" aria-label="Charts">
        <h2 className="charts-title">Charts</h2>
        <div className="skeleton chart" />
        <div className="skeleton chart" />
      </aside>
    </div>
  );
}