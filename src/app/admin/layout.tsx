// app/admin/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const APP_HOME_PATH = process.env.NEXT_PUBLIC_APP_HOME_PATH ?? "/";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;

  // Not logged in OR not an admin → bounce to main app (or you could use `notFound()`).
  if (!session || role !== "admin") {
    redirect(APP_HOME_PATH);
  }

  // Admin is allowed; render the admin section.
  return <>{children}</>;
}
