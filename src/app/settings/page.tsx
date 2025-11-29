// src/app/settings/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PrismaClient } from "@prisma/client";
import SettingsShell from "./SettingsShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LOGIN_PATH = "/login";

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

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(LOGIN_PATH);
  }

  const sessionUser = session.user as any;
  const email = (sessionUser?.email as string | undefined) ?? "";
  let name = (sessionUser?.name as string | undefined) ?? "";
  let image: string | null =
    (sessionUser?.image as string | undefined) ?? null;

  // Pull the latest avatar (and name if needed) from the DB
  if (email) {
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { name: true, image: true },
    });

    if (dbUser) {
      if (dbUser.name && !name) {
        name = dbUser.name;
      }
      if (dbUser.image) {
        image = dbUser.image;
      }
    }
  }

  const initialProfile = {
    name,
    email,
    image,
  };

  return <SettingsShell initialProfile={initialProfile} />;
}