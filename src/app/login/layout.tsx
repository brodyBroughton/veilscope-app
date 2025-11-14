// src/app/login/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const runtime = "nodejs";            // ensure Node runtime (safe with next-auth)
export const dynamic = "force-dynamic";     // don't cache auth decisions
export const revalidate = 0;

export default async function LoginLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions); // App Router pattern with next-auth
  if (session?.user) {
    const home = process.env.NEXT_PUBLIC_APP_HOME_PATH ?? "/";
    redirect(home); // server-side redirect before rendering the login UI
  }
  return children;
}
