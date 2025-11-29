// app/admin/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PrismaClient } from "@prisma/client";
import AdminTopbar from "./AdminTopbar";
import styles from "./AdminShell.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const APP_HOME_PATH = process.env.NEXT_PUBLIC_APP_HOME_PATH ?? "/";

const prisma = new PrismaClient();

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect(APP_HOME_PATH);
  }

  const email = session.user.email;

  // Fetch fresh user from DB so we always have up-to-date name / role / image
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      image: true,
      role: true,
    },
  });

  if (!user || user.role !== "admin") {
    redirect(APP_HOME_PATH);
  }

  return (
    <div className={styles.adminShell}>
      <AdminTopbar
        email={user.email ?? null}
        avatarUrl={user.image ?? null}
        name={user.name ?? null}
      />
      <main className={styles.adminMain}>{children}</main>
    </div>
  );
}
