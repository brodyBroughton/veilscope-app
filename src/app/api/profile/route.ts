// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Reuse Prisma in dev (same pattern as your avatar route)
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const noStore: HeadersInit = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

// PATCH /api/profile  -> update current user's name
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStore }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: noStore }
    );
  }

  const { name } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400, headers: noStore }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { name: name.trim() },
      select: { name: true, email: true, image: true, id: true },
    });

    return NextResponse.json(user, { status: 200, headers: noStore });
  } catch (err) {
    console.error("Error updating profile name", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500, headers: noStore }
    );
  }
}
