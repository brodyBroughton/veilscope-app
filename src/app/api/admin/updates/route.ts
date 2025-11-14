// src/app/api/admin/updates/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

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

// Used for both create + update
const UpdateBaseSchema = z.object({
  title: z.string().min(3).max(200),
  summary: z.string().min(3).max(1000),
  date: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  slug: z.string().min(1).max(200).optional(),
  image: z.string().max(500).optional().default(""),
  imageAlt: z.string().max(500).optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
  content: z.string().optional().default(""),
});

const CreateUpdateSchema = UpdateBaseSchema;

const UpdateUpdateSchema = UpdateBaseSchema.partial().extend({
  id: z.string().min(1),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "admin") {
    return null;
  }
  return session;
}

/**
 * Enforce: at most 2 featured updates,
 * and always keep the *newly* featured record plus the most recent other one.
 *
 * - `newFeaturedId` is the update that was just created/updated with featured = true.
 * - We keep:
 *    - that record, plus
 *    - the newest (by `date`) other featured record
 *   and un-feature any additional ones.
 */
async function enforceFeaturedCap(tx: PrismaClient, newFeaturedId: string) {
  // Find all *other* featured updates ordered by date DESC (newest first)
  const others = await tx.update.findMany({
    where: {
      featured: true,
      NOT: { id: newFeaturedId },
    },
    orderBy: { date: "desc" },
    select: { id: true },
  });

  // We want: newFeatured + at most ONE other (the newest one).
  if (others.length > 1) {
    const toUnfeature = others.slice(1); // keep others[0], unfeature the rest
    await tx.update.updateMany({
      where: {
        id: {
          in: toUnfeature.map((o) => o.id),
        },
      },
      data: { featured: false },
    });
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await prisma.update.findMany({
    orderBy: { date: "desc" },
  });

  return NextResponse.json(
    updates.map((u) => ({
      id: u.id,
      slug: u.slug,
      title: u.title,
      summary: u.summary,
      date: u.date.toISOString().slice(0, 10), // YYYY-MM-DD for form
      image: u.image,
      imageAlt: u.imageAlt,
      tags: u.tags,
      featured: u.featured,
      published: u.published,
      content: u.content,
    }))
  );
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = CreateUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build a unique slug first (outside transaction; DB has unique constraint as a safety net)
    const baseSlug = data.slug?.trim() || slugify(data.title);
    let slug = baseSlug;
    let counter = 2;
    // ensure slug unique
    while (
      await prisma.update.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Create + enforce "max 2 featured" inside a transaction
    const created = await prisma.$transaction(async (tx) => {
      const createdUpdate = await tx.update.create({
        data: {
          slug,
          title: data.title,
          summary: data.summary,
          date: new Date(data.date),
          image: data.image ?? "",
          imageAlt: data.imageAlt ?? "",
          tags: data.tags ?? [],
          featured: data.featured ?? false,
          content: data.content ?? "",
          published: data.published ?? true,
        },
      });

      if (createdUpdate.featured) {
        await enforceFeaturedCap(tx as any, createdUpdate.id);
      }

      return createdUpdate;
    });

    return NextResponse.json(
      {
        id: created.id,
        slug: created.slug,
        title: created.title,
        summary: created.summary,
        date: created.date.toISOString().slice(0, 10),
        image: created.image,
        imageAlt: created.imageAlt,
        tags: created.tags,
        featured: created.featured,
        published: created.published,
        content: created.content,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Admin updates POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = UpdateUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...rest } = parsed.data;

    // Build update data object
    const data: any = {};
    if (rest.title !== undefined) data.title = rest.title;
    if (rest.summary !== undefined) data.summary = rest.summary;
    if (rest.date !== undefined) data.date = new Date(rest.date);
    if (rest.image !== undefined) data.image = rest.image;
    if (rest.imageAlt !== undefined) data.imageAlt = rest.imageAlt;
    if (rest.tags !== undefined) data.tags = rest.tags;
    if (rest.featured !== undefined) data.featured = rest.featured;
    if (rest.published !== undefined) data.published = rest.published;
    if (rest.content !== undefined) data.content = rest.content;

    // Slug handling (unique, like POST)
    if (rest.slug !== undefined) {
      const baseSlug =
        rest.slug.trim() || (rest.title ? slugify(rest.title) : "");
      let slug = baseSlug;
      let counter = 2;

      while (
        slug &&
        (await prisma.update.findFirst({
          where: {
            slug,
            NOT: { id },
          },
          select: { id: true },
        }))
      ) {
        slug = `${baseSlug}-${counter++}`;
      }

      if (slug) data.slug = slug;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.update.update({
        where: { id },
        data,
      });

      if (updatedRecord.featured) {
        await enforceFeaturedCap(tx as any, updatedRecord.id);
      }

      return updatedRecord;
    });

    return NextResponse.json({
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      summary: updated.summary,
      date: updated.date.toISOString().slice(0, 10),
      image: updated.image,
      imageAlt: updated.imageAlt,
      tags: updated.tags,
      featured: updated.featured,
      published: updated.published,
      content: updated.content,
    });
  } catch (err) {
    console.error("Admin updates PATCH error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
