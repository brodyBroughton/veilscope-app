// src/app/api/analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Prisma
const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

type Severity = "good" | "medium" | "bad";

interface Factor {
  label: string;
  text: string;
  sev: Severity;
}

interface CompanyLike {
  name: string;
  desc: string;
  ticker: string;
  score: number | null;
  factors: Factor[];
}

// Your Python deployment base URL
const PYTHON_BASE_URL = "https://veilscope-temp.vercel.app";

const DEFAULT_YEAR = 2025;
const DEFAULT_QUARTER = 3;

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const userFromSession = session?.user as { id?: string | null; email?: string | null } | undefined;
  if (!userFromSession) return null;

  if (userFromSession.id) return userFromSession.id;

  if (userFromSession.email) {
    const user = await prisma.user.findUnique({ where: { email: userFromSession.email } });
    return user?.id ?? null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ticker: string | undefined;

  try {
    const body = await req.json();
    ticker = (body?.ticker as string | undefined)?.toUpperCase();
  } catch {
    ticker = undefined;
  }

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing 'ticker' in request body" },
      { status: 400 }
    );
  }

  // Call Python /api/analyze
  const url = new URL("/api/analyze", PYTHON_BASE_URL);
  url.searchParams.set("ticker", ticker);
  url.searchParams.set("year", String(DEFAULT_YEAR));
  url.searchParams.set("quarter", String(DEFAULT_QUARTER));

  let external: any;
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("External analyze error:", res.status, text);
      return NextResponse.json(
        { error: "Analysis failed", status: res.status },
        { status: 500 }
      );
    }

    external = await res.json();
  } catch (err) {
    console.error("Analysis route error:", err);
    return NextResponse.json(
      { error: "Analysis request failed" },
      { status: 500 }
    );
  }

  // Normalize into CompanyLike
  const data: CompanyLike = {
    name: String(external.name ?? ""),
    desc: String(external.desc ?? ""),
    ticker: String(external.ticker ?? ticker).toUpperCase(),
    score:
      typeof external.score === "number"
        ? external.score
        : external.score == null
        ? null
        : Number(external.score) || null,
    factors: Array.isArray(external.factors)
      ? external.factors.map((f: any) => ({
          label: String(f.label ?? ""),
          text: String(f.text ?? ""),
          sev:
            f.sev === "good" || f.sev === "medium" || f.sev === "bad"
              ? f.sev
              : ("medium" as Severity),
        }))
      : [],
  };

  // Upsert Item for this user+ticker
  const existing = await prisma.item.findFirst({
    where: {
      userId,
      ticker: data.ticker,
      deletedAt: null,
    },
  });

  if (existing) {
    await prisma.item.update({
      where: { id: existing.id },
      data: {
        title: existing.title || `${data.ticker} analysis`,
        ticker: data.ticker,
        type: "analysis",
        content: data as unknown as Prisma.InputJsonValue,
      },
    });
  } else {
    await prisma.item.create({
      data: {
        title: `${data.ticker} analysis`,
        ticker: data.ticker,
        type: "analysis",
        userId,
        content: data as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return NextResponse.json(data);
}