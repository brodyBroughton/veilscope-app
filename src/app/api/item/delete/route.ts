// src/app/api/item/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
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

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tickerRaw = typeof body.ticker === "string" ? body.ticker : "";
  if (!tickerRaw) {
    return NextResponse.json(
      { error: "Missing required field: ticker" },
      { status: 400 }
    );
  }

  const ticker = tickerRaw.toUpperCase();
  const result = await prisma.item.updateMany({
    where: {
      userId,
      ticker,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({ deleted: result.count });
}
