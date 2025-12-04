// src/lib/summaryClient.ts

export interface CompanySummary {
  ticker: string;
  name: string;
  desc: string;
}

export interface SummarySearchResult {
  results: CompanySummary[];
}

/**
 * Fetch company summaries (ticker/name/desc) from the external Python service.
 */
export async function searchCompanySummaries(query: string): Promise<CompanySummary[]> {
  const baseUrl = process.env.ANALYSIS_SERVICE_BASE_URL;
  if (!baseUrl) {
    throw new Error("ANALYSIS_SERVICE_BASE_URL is not set");
  }

  if (!query.trim()) return [];

  const url = new URL("/api/summary", baseUrl);
  url.searchParams.set("q", query.trim());

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Summary search failed (${res.status}): ${text || res.statusText}`);
  }

  const data = (await res.json()) as SummarySearchResult;
  if (!Array.isArray(data.results)) {
    throw new Error("Summary search response has unexpected shape");
  }

  return data.results;
}
