// src/app/api/public/updates/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Shape for public updates (what marketing site expects)
type PublicUpdate = {
  slug: string;
  title: string;
  summary: string;
  date: string; // ISO date
  image: string;
  imageAlt: string;
  tags: string[];
  featured: boolean;
  content: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

export async function OPTIONS() {
  // Preflight response for CORS
  return NextResponse.json(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  // Only send published updates to the public site
  const updates = await prisma.update.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
  });

  const body: { updates: PublicUpdate[] } = {
    updates: updates.map((u) => ({
      slug: u.slug,
      title: u.title,
      summary: u.summary,
      date: u.date.toISOString(),
      image: u.image,
      imageAlt: u.imageAlt,
      tags: u.tags,
      featured: u.featured,
      content: u.content,
    })),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
