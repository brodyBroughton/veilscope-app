import NextAuth from "next-auth";
import { authOptions } from "@/auth";

// App Router handler for NextAuth v4.
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Prisma requires the Node runtime in this route.
export const runtime = "nodejs";
