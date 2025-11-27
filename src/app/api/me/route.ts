import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStore: HeadersInit = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStore }
    );
  }

  // Return email and role (used by Topbar to show admin menu)
  return NextResponse.json(
    {
      email,
      role: role ?? null,
    },
    { headers: noStore }
  );
}
