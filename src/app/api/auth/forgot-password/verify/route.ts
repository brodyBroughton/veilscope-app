import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const globalForPrisma = global as unknown as { prisma?: any };

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

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  let email: string;
  let code: string;
  let newPassword: string;

  try {
    const body = await req.json();
    email = (body?.email ?? "").trim().toLowerCase();
    code = (body?.code ?? "").trim();
    newPassword = body?.newPassword ?? "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: noStore }
    );
  }

  if (!email || !code || !newPassword) {
    return NextResponse.json(
      { error: "Email, code, and new password are required." },
      { status: 400, headers: noStore }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400, headers: noStore }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid code or code has expired." },
        { status: 400, headers: noStore }
      );
    }

    const now = new Date();

    const reset = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        code,
        usedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!reset) {
      return NextResponse.json(
        { error: "Invalid code or code has expired." },
        { status: 400, headers: noStore }
      );
    }

    if (reset.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 400, headers: noStore }
      );
    }

    // Track attempts
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { attempts: reset.attempts + 1 },
    });

    // Use your actual field: passwordHash
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
        },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: now },
      }),
    ]);

    return NextResponse.json(
      { message: "Password updated successfully." },
      { status: 200, headers: noStore }
    );
  } catch (err) {
    console.error("Error verifying password reset:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: noStore }
    );
  }
}