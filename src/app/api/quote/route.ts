// app/api/quote/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore: HeadersInit = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

type FinnhubQuoteResponse = {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
};

export type QuotePayload = {
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

const CACHE_TTL_MS = 10_000; // 10s cache per symbol
const quoteCache = new Map<
  string,
  { quote: QuotePayload; timestamp: number }
>();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const symbolParam = url.searchParams.get("symbol");

  if (!symbolParam) {
    return NextResponse.json(
      { error: "Missing symbol query parameter ?symbol=XYZ" },
      { status: 400, headers: noStore },
    );
  }

  const symbol = symbolParam.trim().toUpperCase();

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY is not configured on the server" },
      { status: 500, headers: noStore },
    );
  }

  const now = Date.now();
  const cached = quoteCache.get(symbol);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.quote, { headers: noStore });
  }

  const finnhubUrl = new URL("https://finnhub.io/api/v1/quote");
  finnhubUrl.searchParams.set("symbol", symbol);
  finnhubUrl.searchParams.set("token", apiKey);

  const upstream = await fetch(finnhubUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Upstream quote request failed", status: upstream.status },
      { status: upstream.status, headers: noStore },
    );
  }

  const raw = (await upstream.json()) as Partial<FinnhubQuoteResponse>;

  // Finnhub returns { c: 0, d: null, dp: null, ... } when symbol is invalid / no data
  if (typeof raw.c !== "number" || raw.c <= 0) {
    return NextResponse.json(
      { error: "No quote data for symbol", symbol },
      { status: 404, headers: noStore },
    );
  }

  const quote: QuotePayload = {
    symbol,
    price: raw.c ?? 0,
    change: raw.d ?? 0,
    changePct: raw.dp ?? 0,
    high: raw.h ?? 0,
    low: raw.l ?? 0,
    open: raw.o ?? 0,
    prevClose: raw.pc ?? 0,
    asOf: new Date().toISOString(),
  };

  quoteCache.set(symbol, { quote, timestamp: now });

  return NextResponse.json(quote, { headers: noStore });
}
