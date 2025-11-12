// src/proxy.ts
// Next.js 16 "proxy" (replacement for middleware.ts) + NextAuth v4 protection.

import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

// Wrap NextAuth's middleware. Keep /login, /signup, and /api/auth open.
// For DB sessions, token may be null, so we also check the session cookie.
const secured = withAuth(
  function proxy(_req: NextRequest) {
    // Optional: add per-request logic here (e.g., locale).
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Public routes (no auth required)
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/signup") ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // JWT strategy would yield a token when signed in
        if (token) return true;

        // Database session strategy: check NextAuth session cookies
        const hasDbSession =
          req.cookies.has("next-auth.session-token") ||
          req.cookies.has("__Secure-next-auth.session-token");

        return hasDbSession;
      },
    },
  }
);

// Export default for Next.js 16 proxy
export default secured;

// Run on everything except framework/static assets and the public allowlist above.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|login|signup|api/auth).*)",
  ],
};
