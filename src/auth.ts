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

type UserRole = "user" | "admin";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // JWT sessions keep the role available to middleware and server actions.
  session: { strategy: "jwt" },

  // Unauthenticated users go to /login.
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

        const normalizedEmail = parsed.data.email.trim().toLowerCase();
        const { password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Return fields that should be persisted in the initial JWT.
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
    // Shape the JWT so downstream middleware and server actions can read role, id, and image.
    async jwt({ token, user }) {
      // On first sign-in, `user` is defined (from provider/authorize).
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        token.email = user.email ?? token.email;

        // Role
        (token as any).role =
          ((user as any).role as UserRole | undefined) ??
          ((token as any).role as UserRole | undefined) ??
          ("user" as UserRole);

        // Image (from provider/DB)
        const rawImageFromUser =
          ((user as any).image as string | null | undefined) ?? null;
        const existingImage =
          ((token as any).image as string | null | undefined) ?? null;

        const chosenImage = rawImageFromUser ?? existingImage;
        (token as any).image =
          chosenImage && chosenImage.trim().length > 0 ? chosenImage : null;
      }

      // Backfill role and/or image once if omitted but we have the email.
      if ((!(token as any).role || (token as any).image == null) && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true, image: true },
        });

        if (!(token as any).role) {
          (token as any).role =
            (dbUser?.role as UserRole | undefined) ?? ("user" as UserRole);
        }

        if ((token as any).image == null) {
          const rawImage = dbUser?.image ?? null;
          (token as any).image =
            rawImage && rawImage.trim().length > 0 ? rawImage : null;
        }
      }

      return token;
    },

    // Mirror role, id, and image into session.user for client-side checks.
    async session({ session, token }) {
      if (session.user) {
        // Email + id + role
        session.user.email = token.email as string | undefined;
        (session.user as any).id = token.sub;
        (session.user as any).role =
          ((token as any).role as UserRole | undefined) ?? ("user" as UserRole);

        // Image from token (normalized)
        const rawImage =
          ((token as any).image as string | null | undefined) ?? null;
        const image =
          rawImage && rawImage.trim().length > 0 ? rawImage : null;

        session.user.image = image;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);