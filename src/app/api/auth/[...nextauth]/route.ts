// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/auth";

// App Router pattern for NextAuth v4
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Ensure Node runtime (Prisma needs Node, not Edge)
export const runtime = "nodejs";
