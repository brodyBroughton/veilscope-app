// src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";

export const runtime = "nodejs";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://app.veilscope.com",
]);

export async function POST(request: Request) {
  // headers() is async in the App Router
  const hdrs = await nextHeaders();
  const origin = hdrs.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();

  // In JWT mode this is the JWT cookie; in DB mode it's the session token.
  const sessionCookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
  ];

  // Build redirect target using env or current origin (works on localhost & prod)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
  const loginUrl = new URL("/login", base);
  const res = NextResponse.redirect(loginUrl, 303);

  // Clear cookies (both secure and non-secure variants)
  const clearCookie = (name: string, secure: boolean) => {
    res.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });
  };
  for (const name of [
    ...sessionCookieNames,
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "next-auth.state",
    "__Secure-next-auth.state",
  ]) {
    clearCookie(name, true);
    clearCookie(name, false);
  }

  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("Pragma", "no-cache");
  // Wipe cache & storage & cookies for max safety (supported on secure contexts)
  res.headers.set("Clear-Site-Data", '"cache", "storage", "cookies"');

  return res;
}
