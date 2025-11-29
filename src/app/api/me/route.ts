// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStore: HeadersInit = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStore }
    );
  }

  // Fetch user from DB so we can get name + image + role
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      image: true,
      role: true, // if you have this column; otherwise remove
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: noStore }
    );
  }

  return NextResponse.json(user, { headers: noStore });
}