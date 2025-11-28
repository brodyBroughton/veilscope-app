// app/api/folders/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const noStore: HeadersInit = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
}

// PATCH /api/folders/:id  → rename, move, reorder
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return unauthorized();

  const { id } = await params;

  const body = await req.json();
  const { name, parentId, sortOrder } = body as {
    name?: string;
    parentId?: string | null;
    sortOrder?: number;
  };

  const existing = await prisma.folder.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
  }

  const folder = await prisma.folder.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(parentId !== undefined ? { parentId } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    },
  });

  return NextResponse.json(folder, { headers: noStore });
}

// DELETE /api/folders/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.folder.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
  }

  await prisma.folder.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true }, { headers: noStore });
}
