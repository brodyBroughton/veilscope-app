export type Severity = "good" | "medium" | "bad";
export interface Factor { label: string; text: string; sev: Severity }
export interface Company { name: string; desc: string; score: number | null; factors: Factor[] }
export type DataMap = Record<string, Company>;

export const DATA: DataMap = {                                    // change score to see sample  V
  SAMPLE: { name: "Sample Company", desc: "Demonstration scorecard for layout preview.", score: null,
    factors: [
      { label: "Market dynamics", text: "Mixed trends across segments.", sev: "medium" },
      { label: "Customer concentration", text: "Top clients >30% of revenue.", sev: "bad" },
      { label: "Cash runway", text: "12–18 months projected.", sev: "good" },
      { label: "Leadership turnover", text: "Recent changes introduce uncertainty.", sev: "medium" },
      { label: "Debt covenants", text: "No near-term breaches expected.", sev: "good" },
      { label: "Supply dependencies", text: "Single-source components.", sev: "bad" },
      { label: "Product maturity", text: "Early-stage adoption.", sev: "medium" }
    ]}
};