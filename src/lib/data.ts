export type Severity = "good" | "medium" | "bad";
export interface Factor { label: string; text: string; sev: Severity }
export interface Company { name: string; desc: string; score: number; factors: Factor[] }
export type DataMap = Record<string, Company>;

export const DATA: DataMap = {
  AAPL: { name: "Apple Inc.", desc: "Consumer electronics and services.", score: 82,
    factors: [
      { label: "Product diversification", text: "Strong ecosystem defends margins.", sev: "good" },
      { label: "Supply chain concentration", text: "Exposure to key suppliers remains.", sev: "medium" },
      { label: "Regulatory scrutiny", text: "App store policies under review.", sev: "medium" },
      { label: "Currency/FX", text: "Headwinds moderated vs prior year.", sev: "good" },
      { label: "Hardware cycle risk", text: "Upgrade cadence can slow revenue.", sev: "medium" },
      { label: "Services growth", text: "Recurring revenue offsets cycles.", sev: "good" },
      { label: "Geographic concentration", text: "China exposure is a watch item.", sev: "bad" }
    ]},
  MSFT: { name: "Microsoft Corporation", desc: "Software, cloud, and AI services.", score: 88,
    factors: [
      { label: "Cloud growth", text: "Azure expansion remains robust.", sev: "good" },
      { label: "AI integration", text: "Copilot adoption early but rising.", sev: "good" },
      { label: "Competition", text: "Cloud & productivity markets are crowded.", sev: "medium" },
      { label: "Regulatory/Antitrust", text: "Ongoing reviews across regions.", sev: "medium" },
      { label: "Enterprise retention", text: "High switching costs favor renewals.", sev: "good" },
      { label: "Security incidents", text: "Industry-wide risks persist.", sev: "medium" },
      { label: "FX exposure", text: "Manageable against diversified base.", sev: "good" }
    ]},
  NVDA: { name: "NVIDIA Corporation", desc: "Semiconductors for accelerated computing and AI.", score: 91,
    factors: [
      { label: "Demand concentration", text: "High reliance on hyperscalers.", sev: "medium" },
      { label: "Supply capacity", text: "Foundry constraints improving.", sev: "good" },
      { label: "Competitive landscape", text: "New entrants and custom silicon.", sev: "medium" },
      { label: "Product leadership", text: "Strong moat in software ecosystem.", sev: "good" },
      { label: "Export controls", text: "Restrictions can affect shipments.", sev: "bad" },
      { label: "Inventory risk", text: "Tied to rapid product cycles.", sev: "medium" },
      { label: "Ecosystem dependency", text: "CUDA/software aids stickiness.", sev: "good" }
    ]},
  XOM: { name: "Exxon Mobil Corporation", desc: "Integrated energy company.", score: 67,
    factors: [
      { label: "Commodity price volatility", text: "Earnings sensitive to crude prices.", sev: "medium" },
      { label: "Energy transition", text: "Policy shifts pose long-term risks.", sev: "bad" },
      { label: "Operational scale", text: "Diversification across upstream/downstream.", sev: "good" },
      { label: "Capex discipline", text: "Project execution remains key.", sev: "medium" },
      { label: "Regulatory/environmental", text: "Litigation and compliance risk.", sev: "bad" },
      { label: "Balance sheet", text: "Improved leverage vs prior cycle.", sev: "good" },
      { label: "Geopolitical exposure", text: "Sanctions and regional risks.", sev: "medium" }
    ]},
  SAMPLE: { name: "Sample Company", desc: "Demonstration scorecard for layout preview.", score: 50,
    factors: [
      { label: "Market dynamics", text: "Mixed trends across segments.", sev: "medium" },
      { label: "Customer concentration", text: "Top clients >30% of revenue.", sev: "bad" },
      { label: "Cash runway", text: "12–18 months projected.", sev: "good" },
      { label: "Leadership turnover", text: "Recent changes introduce uncertainty.", sev: "medium" },
      { label: "Debt covenants", text: "No near-term breaches expected.", sev: "good" },
      { label: "Supply dependencies", text: "Single-source components.", sev: "bad" },
      { label: "Product maturity", text: "Early-stage adoption.", sev: "medium" }
    ]},
  SGMA: { name: "Sigma Company", desc: "Cool Sigma company who makes money", score: 67,
    factors: [
      { label: "Market dynamics", text: "Mixed trends across segments.", sev: "bad" },
      { label: "Customer concentration", text: "Top clients >30% of revenue.", sev: "bad" },
      { label: "Cash runway", text: "12–18 months projected.", sev: "bad" },
      { label: "Leadership turnover", text: "Recent changes introduce uncertainty.", sev: "bad" },
      { label: "Debt covenants", text: "No near-term breaches expected.", sev: "bad" },
      { label: "Supply dependencies", text: "Single-source components.", sev: "bad" },
      { label: "Product maturity", text: "Early-stage adoption.", sev: "bad" }
    ]}
};
