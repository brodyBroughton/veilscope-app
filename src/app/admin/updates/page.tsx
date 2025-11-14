// src/app/admin/updates/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AdminUpdatesClient from "./AdminUpdatesClient";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const runtime = "nodejs";

export default async function AdminUpdatesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || role !== "admin") {
    // could also redirect("/login") if you prefer
    redirect("/");
  }

  const updates = await prisma.update.findMany({
    orderBy: { date: "desc" },
  });

  const initialUpdates = updates.map((u) => ({
    id: u.id,
    slug: u.slug,
    title: u.title,
    summary: u.summary,
    date: u.date.toISOString().slice(0, 10), // YYYY-MM-DD
    image: u.image,
    imageAlt: u.imageAlt,
    tags: u.tags,
    featured: u.featured,
    published: u.published,
    content: u.content,
  }));

  return <AdminUpdatesClient initialUpdates={initialUpdates} />;
}
