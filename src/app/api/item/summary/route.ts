// src/app/api/item/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Reuse Prisma in dev
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

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const userFromSession = session?.user as { id?: string | null; email?: string | null } | undefined;
  if (!userFromSession) return null;

  // Prefer id if you add it to the session
  if (userFromSession.id) return userFromSession.id;

  // Fallback: look up by email
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

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  const desc = typeof body.desc === "string" ? body.desc : "";
  const tickerRaw = typeof body.ticker === "string" ? body.ticker : "";

  if (!name || !desc || !tickerRaw) {
    return NextResponse.json(
      { error: "Missing required fields: ticker, name, desc" },
      { status: 400 }
    );
  }

  const ticker = tickerRaw.toUpperCase();

  const existing = await prisma.item.findFirst({
    where: {
      userId,
      ticker,
      deletedAt: null,
    },
  });

  // If we already have an item, keep existing score/factors, but update name/desc/ticker
  if (existing?.content) {
    const prev = existing.content as any;

    const itemContent: CompanyLike = {
      name,
      desc,
      ticker,
      score: typeof prev.score === "number" ? prev.score : null,
      factors: Array.isArray(prev.factors) ? prev.factors : [],
    };

    await prisma.item.update({
      where: { id: existing.id },
      data: {
        title: name,
        ticker,
        type: existing.type ?? "company",
        content: itemContent as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(itemContent);
  }

  // Otherwise create a fresh item with empty analysis
  const itemContent: CompanyLike = {
    name,
    desc,
    ticker,
    score: null,
    factors: [],
  };

  await prisma.item.create({
    data: {
      title: name,
      ticker,
      type: "company",
      userId,
      content: itemContent as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(itemContent);
}
