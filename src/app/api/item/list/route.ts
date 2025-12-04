// src/app/api/item/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

interface SavedItemDTO {
  id: string;
  ticker: string;
  name: string;
  desc: string;
  score: number | null;
  factors: Factor[];
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

export async function GET(_req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.item.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  const payload: SavedItemDTO[] = items
    .map((item) => {
      const c = item.content as any;

      const ticker =
        (c && typeof c.ticker === "string" && c.ticker) ||
        (typeof item.ticker === "string" ? item.ticker : "");
      const name =
        (c && typeof c.name === "string" && c.name) ||
        (typeof item.title === "string" ? item.title : "");
      const desc = c && typeof c.desc === "string" ? c.desc : "";

      if (!ticker || !name) return null;

      const score =
        c && typeof c.score === "number" ? c.score : null;
      const factors: Factor[] =
        c && Array.isArray(c.factors)
          ? c.factors.map((f: any) => ({
              label: String(f.label ?? ""),
              text: String(f.text ?? ""),
              sev:
                f.sev === "good" || f.sev === "medium" || f.sev === "bad"
                  ? f.sev
                  : ("medium" as Severity),
            }))
          : [];

      return {
        id: item.id,
        ticker: ticker.toUpperCase(),
        name,
        desc,
        score,
        factors,
      };
    })
    .filter(Boolean) as SavedItemDTO[];

  return NextResponse.json(payload);
}
