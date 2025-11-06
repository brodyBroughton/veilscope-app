import { DATA } from "@/lib/data";

export default function Workbench({ activeKey }: { activeKey: string }) {
  const company = DATA[activeKey] ?? DATA.SAMPLE;
  return (
    <div className="workbench">
      <main className="pane-main" id="content" tabIndex={-1}>
        <h1 className="company">{company.name}</h1>
        <p className="desc">{company.desc}</p>
        <div className="score">Score: <strong>{company.score}/100</strong></div>
        <section aria-labelledby="factors-title" className="factors">
          <h2 id="factors-title" className="sr-only">Risk Factors</h2>
          <ul className="factor-list" role="list">
            {company.factors.map((f, i) => (
              <li key={i}><span className={`dot ${f.sev}`}></span><strong>{f.label}:</strong> <span>{f.text}</span></li>
            ))}
          </ul>
        </section>
      </main>

      <aside className="pane-side" aria-label="Charts">
        <h2 className="charts-title">Charts</h2>
        <div className="skeleton chart" />
        <div className="skeleton chart" />
      </aside>
    </div>
  );
}
