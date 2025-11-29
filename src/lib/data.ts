export type Severity = "good" | "medium" | "bad";

export interface Factor {
  label: string;
  text: string;
  sev: Severity;
}

export interface Company {
  name: string;
  desc: string;
  score: number | null;
  factors: Factor[];
  ticker: string;        // 🔹 NEW: link to live quote
}

export type DataMap = Record<string, Company>;

export const DATA: DataMap = {
  // Company WITH data (Apple as a demo)
  ALPHA: {
    name: "Apple Inc.",
    desc: "Large-cap technology company with diversified hardware, software, and services revenue.",
    ticker: "AAPL",
    score: 82,
    factors: [
      {
        label: "Revenue quality",
        text: "High mix of recurring services and ecosystem-driven hardware demand.",
        sev: "good",
      },
      {
        label: "Customer concentration",
        text: "Large, diversified customer base with no single-customer dependency.",
        sev: "good",
      },
      {
        label: "Profitability",
        text: "Sustained high margins and strong free cash flow generation.",
        sev: "good",
      },
      {
        label: "Regulatory exposure",
        text: "Ongoing antitrust and platform regulation scrutiny in multiple regions.",
        sev: "medium",
      },
      {
        label: "Leverage",
        text: "Net cash position with active capital return program.",
        sev: "good",
      },
      {
        label: "Execution risk",
        text: "Execution risk around new product categories and ecosystem expansion.",
        sev: "medium",
      },
    ],
  },

  // Company with NO analysis yet (will show the “Run analysis” empty state)
  NODATA: {
    name: "Horizon Biotech Labs",
    desc: "Pre-revenue biotech platform focused on early-stage oncology assets.",
    ticker: "Not a real ticker", // real ticker (Vertex Pharmaceuticals) for demo API usage
    score: null,
    factors: [], // no factors → hasAnalysis = false
  },
};
