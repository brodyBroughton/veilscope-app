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

  // Only admins can access this section; others are redirected home.
  if (!session || role !== "admin") {
    redirect(APP_HOME_PATH);
  }

  return <>{children}</>;
}
