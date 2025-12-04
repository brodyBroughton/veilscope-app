// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";

type CompanySummary = {
  ticker: string;
  name: string;
  desc: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const baseUrl = process.env.ANALYSIS_SERVICE_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { results: [], error: "ANALYSIS_SERVICE_BASE_URL not set" },
      { status: 500 }
    );
  }

  const url = new URL("/api/summary", baseUrl);
  url.searchParams.set("q", q.trim());

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Summary search failed:", res.status, text);
      return NextResponse.json(
        { results: [], error: "Search failed" },
        { status: 500 }
      );
    }

    const data = (await res.json()) as { results: CompanySummary[] };
    return NextResponse.json({ results: data.results ?? [] });
  } catch (err) {
    console.error("Summary search error:", err);
    return NextResponse.json(
      { results: [], error: "Search failed" },
      { status: 500 }
    );
  }
}
