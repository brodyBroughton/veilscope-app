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

interface AnalysisFactsResponse {
  eps: Record<string, unknown>;
  cashflow: Record<string, unknown>;
  revenue: Record<string, unknown>;
}

interface AnalysisInsightsResponse {
  revenue: Record<string, unknown>;
  cashflow: Record<string, unknown>;
  debt: Record<string, unknown>;
  stockinfo: unknown[];
}

const isEnvEnabled = (value: string | undefined, defaultValue: boolean) => {
  if (value == null || value === "") return defaultValue;
  return value.toLowerCase() !== "false";
};


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
  const pythonBaseUrl = process.env.PYTHON_API_BASE_URL;
  const pythonToken = process.env.PYTHON_API_TOKEN;
  const enableFacts = isEnvEnabled(process.env.PYTHON_ENABLE_FACTS, true);
  const enableInsights = isEnvEnabled(process.env.PYTHON_ENABLE_INSIGHTS, false);

  if (!pythonBaseUrl || !pythonToken) {
    return NextResponse.json(
      { error: "Python API is not configured" },
      { status: 500 }
    );
  }

  if (!enableFacts && !enableInsights) {
    return NextResponse.json(
      { error: "Both analysis endpoints are disabled" },
      { status: 400 }
    );
  }

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

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${pythonToken}`,
  };

  const factsUrl = new URL("/analysis/facts", pythonBaseUrl);
  const insightsUrl = new URL("/analysis/insights", pythonBaseUrl);

  let facts: AnalysisFactsResponse | null = null;
  let insights: AnalysisInsightsResponse | null = null;
  try {
    const requests: Array<Promise<Response>> = [];
    const labels: Array<"facts" | "insights"> = [];

    if (enableFacts) {
      requests.push(
        fetch(factsUrl.toString(), {
          method: "POST",
          headers,
          body: JSON.stringify({ ticker }),
          cache: "no-store",
        })
      );
      labels.push("facts");
    }

    if (enableInsights) {
      requests.push(
        fetch(insightsUrl.toString(), {
          method: "POST",
          headers,
          body: JSON.stringify({ ticker, useCache: true }),
          cache: "no-store",
        })
      );
      labels.push("insights");
    }

    const responses = await Promise.all(requests);
    for (const [index, res] of responses.entries()) {
      const label = labels[index];
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("External analyze error:", {
          endpoint: label,
          status: res.status,
          text,
        });
        return NextResponse.json(
          { error: "Analysis failed" },
          { status: 500 }
        );
      }
    }

    for (const [index, res] of responses.entries()) {
      const label = labels[index];
      if (label === "facts") {
        facts = (await res.json()) as AnalysisFactsResponse;
      } else {
        insights = (await res.json()) as AnalysisInsightsResponse;
      }
    }
  } catch (err) {
    console.error("Analysis route error:", err);
    return NextResponse.json(
      { error: "Analysis request failed" },
      { status: 500 }
    );
  }

  const data = {
    ticker,
    facts,
    insights,
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
