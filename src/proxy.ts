// src/proxy.ts
// Next.js "proxy" (middleware) + NextAuth v4
// - Protects private routes
// - Leaves /login, /signup, /api/auth, and /api/public/** open
// - Redirects signed-in users away from /login to APP_HOME_PATH

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_HOME_PATH = process.env.NEXT_PUBLIC_APP_HOME_PATH ?? "/";

const secured = withAuth(
  function proxy(req: NextRequest) {
    const { pathname, origin } = req.nextUrl;

    // nextauth token is injected by withAuth at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (req as any).nextauth?.token as unknown | null;

    // If already signed in and trying to access /login, send them "home"
    if (token && (pathname === "/login" || pathname.startsWith("/login/"))) {
      return NextResponse.redirect(new URL(APP_HOME_PATH, origin));
    }

    // Otherwise continue to the requested route
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },

    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // --- PUBLIC ROUTES (NO AUTH REQUIRED) ---
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/signup") ||
          pathname.startsWith("/api/signup") || 
          pathname.startsWith("/api/auth") ||   // NextAuth internals
          pathname.startsWith("/api/public")    // <-- our public marketing JSON API
        ) {
          return true;
        }

        // --- EVERYTHING ELSE REQUIRES AUTH ---
        return !!token;
      },
    },
  }
);

export default secured;

// IMPORTANT: middleware should NOT run on static assets, etc.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
