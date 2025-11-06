// src/proxy.ts
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Run Auth.js on every request and enforce the authorized() callback above
export function proxy(req: NextRequest) {
  return auth(req);
}

// Exclude framework/static assets, allow /login and /api/auth/*,
// but run for every other path (including your own /api/** if you want it protected).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|login|api/auth).*)",
  ],
};