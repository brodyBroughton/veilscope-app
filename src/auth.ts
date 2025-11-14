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

// Match your DB: "user" | "admin"
type UserRole = "user" | "admin";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // JWT sessions so middleware & server can read role from the token.
  session: { strategy: "jwt" },

  // Unauthenticated users go to /login
  pages: { signIn: "/login" },

  providers: [
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

        // Return fields we want baked into the JWT on initial sign-in.
        return {
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
          role: (user as any).role ?? ("user" as UserRole),
        };
      },
    }),
  ],

  callbacks: {
    /**
     * JWT callback runs on initial sign-in (with `user`) and on subsequent
     * requests (with only `token`). We use this to attach the role, id, etc.
     * to the token, so it's available in middleware and on the server.
     */
    async jwt({ token, user }) {
      // On first sign-in, `user` is defined (from provider/authorize)
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        token.email = user.email ?? token.email;
        (token as any).role =
          ((user as any).role as UserRole | undefined) ??
          ((token as any).role as UserRole | undefined) ??
          ("user" as UserRole);
      }

      // If somehow the token still has no role but we know the email,
      // backfill it from the DB once. Defensive: keeps RBAC consistent.
      if (!(token as any).role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true },
        });
        (token as any).role =
          (dbUser?.role as UserRole | undefined) ?? ("user" as UserRole);
      }

      return token;
    },

    /**
     * Session callback shapes what the client sees from `useSession()` etc.
     * We mirror role + id into `session.user` for convenient checks in components.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string | undefined;
        (session.user as any).id = token.sub;
        (session.user as any).role =
          ((token as any).role as UserRole | undefined) ?? ("user" as UserRole);
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
