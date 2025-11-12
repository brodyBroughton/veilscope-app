// src/auth.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // We persist sessions in the DB (Session model is in your Prisma schema).
  session: { strategy: "database" },

  // Send unauthenticated users to our login page
  pages: { signIn: "/login" },

  providers: [
    // Google OAuth; support either GOOGLE_* or AUTH_GOOGLE_* env names
    GoogleProvider({
      clientId:
        process.env.GOOGLE_CLIENT_ID ||
        (process.env.AUTH_GOOGLE_ID as string) ||
        "",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        (process.env.AUTH_GOOGLE_SECRET as string) ||
        "",
    }),

    // Email + password (local) sign-in
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
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
    // Put the role on the session object for easy checks client-side
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as any).role = (user as any).role ?? "user";
      }
      return session;
    },
  },
};

// For App Router we still export the handler so /api/auth works via route.ts
export default NextAuth(authOptions);
