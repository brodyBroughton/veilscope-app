// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    // Email + password (local) sign-in
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email!,
          name: user.name ?? null,
          image: user.image ?? null,
          role: (user as any).role ?? "user",
        };
      },
    }),
  ],
  callbacks: {
  async session({ session, user }) {
    if (session.user && user) {
      (session.user as any).role = (user as any).role ?? "user";
    }
    return session;
  },
  async authorized({ auth, request }) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Allow unauthenticated access to the login page and the Auth API endpoints
    if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
      return true;
    }
    // Otherwise require a valid user session
    return !!auth?.user;
  },
},

});
console.log("auth export:", typeof auth);
