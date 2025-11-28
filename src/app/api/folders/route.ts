// app/api/folders/route.ts
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

// GET /api/folders → return folder tree + items for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return unauthorized();

  const folders = await prisma.folder.findMany({
    where: { userId: user.id },
    include: {
      items: true,
    },
    orderBy: [
      { parentId: "asc" },      // group by parent
      { sortOrder: "asc" },     // then by sortOrder
      { createdAt: "asc" },     // stable fallback
    ],
  });

  // Build a tree from the flat list
  const byId: Record<string, any> = {};
  folders.forEach((f) => {
    byId[f.id] = { ...f, children: [] as any[] };
  });

  const roots: any[] = [];

  folders.forEach((f) => {
    const node = byId[f.id];
    if (f.parentId && byId[f.parentId]) {
      byId[f.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return NextResponse.json(roots, { headers: noStore });
}

// POST /api/folders → create a new folder (optionally under parentId)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return unauthorized();

  const body = await req.json();
  const { name, parentId } = body as { name?: string; parentId?: string | null };

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400, headers: noStore });
  }

  // Place the new folder at the end of its sibling list
  const siblingsCount = await prisma.folder.count({
    where: {
      userId: user.id,
      parentId: parentId ?? null,
    },
  });

  const folder = await prisma.folder.create({
    data: {
      name,
      userId: user.id,
      parentId: parentId ?? null,
      sortOrder: siblingsCount,
    },
  });

  return NextResponse.json(folder, { status: 201, headers: noStore });
}
