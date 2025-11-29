import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendPasswordResetEmail } from "@/lib/mail";

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

function getExpiryDate() {
  const minutes = Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES || 15);
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function POST(req: NextRequest) {
  let email: string | undefined;

  try {
    const body = await req.json();
    email = (body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: noStore }
    );
  }

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400, headers: noStore }
    );
  }

  const genericResponse = NextResponse.json(
    {
      message:
        "If an account exists for that email, a reset code will be sent shortly.",
    },
    { status: 200, headers: noStore }
  );

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      // Don't leak existence of email
      return genericResponse;
    }

    // Invalidate previous unused codes
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        usedAt: new Date(),
      },
    });

    const code = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        code,
        expiresAt: getExpiryDate(),
      },
    });

    await sendPasswordResetEmail({
      to: user.email!,
      code,
    });

    return genericResponse;
  } catch (err) {
    console.error("Error starting password reset:", err);
    // Still return generic response
    return genericResponse;
  }
}