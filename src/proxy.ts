import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_HOME_PATH = process.env.NEXT_PUBLIC_APP_HOME_PATH ?? "/";

const secured = withAuth(
  function proxy(req: NextRequest) {
    const { pathname, origin } = req.nextUrl;

    // Token is injected by withAuth at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (req as any).nextauth?.token as unknown | null;

    // Redirect signed-in users away from the login screen.
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

        // Public routes do not require authentication.
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/signup") ||
          pathname.startsWith("/api/signup") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/public")
        ) {
          return true;
        }

        // All other routes require an authenticated token.
        return !!token;
      },
    },
  }
);

export default secured;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets).*)",
  ],
};