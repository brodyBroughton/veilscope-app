// src/app/api/profile/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

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

// Upload / replace avatar
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    );
  }

  const maxBytes = 2 * 1024 * 1024;
  if ((file as any).size && (file as any).size > maxBytes) {
    return NextResponse.json(
      { error: "File too large (max 2MB)" },
      { status: 400 }
    );
  }

  const userId = (session.user as any).id ?? email;

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
      ? "webp"
      : "jpg";

  const objectKey = `avatars/${userId}-${Date.now()}.${ext}`;

  // Upload to Vercel Blob (CDN-backed URL)
  const blob = await put(objectKey, file, {
    access: "public",
  });

  // Store the blob URL on the user
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { image: blob.url },
    select: { image: true },
  });

  return NextResponse.json({ url: updatedUser.image });
}

// Remove avatar (and try to delete blob)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  // Get existing image URL
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { image: true },
  });

  const imageUrl = dbUser?.image ?? null;

  // Attempt to delete the blob (optional but nice to do)
  if (imageUrl) {
    try {
      await del(imageUrl);
    } catch (err) {
      console.error("Failed to delete avatar blob:", err);
      // We don't fail the request just because blob deletion failed.
    }
  }

  // Clear the image field in DB
  await prisma.user.update({
    where: { email },
    data: { image: null },
  });

  return NextResponse.json({ url: null });
}
