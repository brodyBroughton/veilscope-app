# Veilscope App

Veilscope is an AI-powered investment research workspace built with Next.js. It pairs a VS Code–style UI for navigating filings and scorecards with secure authentication, role-based admin tools, and Prisma-backed content APIs.

## Features
- **Authentication with Google or credentials** via NextAuth, JWT sessions, and a Prisma adapter. Roles (`user`/`admin`) are embedded in the token and mirrored to the client session for RBAC checks. 【F:src/auth.ts†L1-L76】【F:src/auth.ts†L90-L121】
- **Login and signup flows** with client-side validation and credential sign-in, plus a Google OAuth button. Signup validates inputs server-side and hashes passwords before persisting. 【F:src/app/login/page.tsx†L1-L118】【F:src/app/api/signup/route.ts†L1-L68】
- **Protected routing middleware** keeps `/login`, `/signup`, and public APIs open while requiring auth elsewhere; signed-in users hitting `/login` are redirected to the configured home path. 【F:src/proxy.ts†L1-L51】
- **Workspace shell** featuring a top bar, tabbed workbench, collapsible drawer, and status bar. Drawer links open sample tickers and 10-K/10-Q scorecards backed by mock data. 【F:src/components/WebAppShell.tsx†L1-L69】【F:src/components/Drawer.tsx†L1-L73】【F:src/lib/data.ts†L1-L38】
- **Admin updates CMS** where admins can create, edit, delete, and bulk-save marketing updates with featured/draft flags. Slugs are auto-unique and featured posts are capped to two. Server routes enforce admin access. 【F:src/app/admin/updates/AdminUpdatesClient.tsx†L1-L220】【F:src/app/api/admin/updates/route.ts†L1-L122】【F:src/app/admin/updates/page.tsx†L1-L37】
- **Logout and profile helpers** including a logout endpoint that clears auth cookies and redirects to `/login`, plus a `me` endpoint that returns the current user email with cache-busting headers. 【F:src/app/api/logout/route.ts†L1-L63】【F:src/app/api/me/route.ts†L1-L24】

## Tech Stack
- [Next.js 16](https://nextjs.org/) (App Router) with TypeScript
- [NextAuth.js](https://next-auth.js.org/) for auth (Google + Credentials)
- [Prisma](https://www.prisma.io/) with PostgreSQL
- React 19, Zod validation, Tailwind/PostCSS toolchain (global stylesheets)

## Project Structure
- `src/app` — App Router pages, layouts, and API routes (`/api/signup`, `/api/logout`, `/api/me`, `/api/admin/updates`).
- `src/components` — UI shell pieces (top bar, drawer, workbench, status bar).
- `src/lib` — Mock data backing sample tickers/scorecards.
- `src/hooks` — Client utilities such as theme switching.
- `prisma` — Prisma schema and migrations for users, folders/items, and marketing updates. 【F:prisma/schema.prisma†L1-L75】

## Prerequisites
- Node.js 18.18+ (Next.js 16 requirement)
- PostgreSQL database for Prisma models

## Environment Variables
Create a `.env` file with the following values:

| Name | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for the primary database. 【F:prisma/schema.prisma†L1-L13】 |
| `SHADOW_DATABASE_URL` | Connection string for Prisma migrations (shadow DB). 【F:prisma/schema.prisma†L1-L13】 |
| `NEXTAUTH_SECRET` | Secret for NextAuth JWT/session encryption. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials. `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are also supported. 【F:src/auth.ts†L19-L40】 |
| `NEXT_PUBLIC_BASE_URL` | Base URL used when redirecting after logout (falls back to request origin). 【F:src/app/api/logout/route.ts†L12-L39】 |
| `NEXT_PUBLIC_APP_HOME_PATH` | Optional path to redirect signed-in users away from `/login`. 【F:src/proxy.ts†L8-L31】 |

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate the Prisma client and apply migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Admin Access
- New signups default to the `user` role. Promote a user to `admin` in the database to access `/admin/updates` and the admin API. Role values are stored on the `User` model and mirrored into session tokens. 【F:prisma/schema.prisma†L9-L28】【F:src/auth.ts†L43-L121】

## Available Scripts
- `npm run dev` — Start the Next.js dev server.
- `npm run build` — Create an optimized production build.
- `npm run start` — Serve the production build.
- `npm run lint` — Run ESLint.
- `npm run format` — Format the codebase with Prettier.

## API Overview
- `POST /api/signup` — Validate email/password, hash credentials, and create a user. Returns `409` for duplicates. 【F:src/app/api/signup/route.ts†L1-L68】
- `POST /api/logout` — Clear NextAuth cookies and redirect to `/login` with cache-busting headers. 【F:src/app/api/logout/route.ts†L1-L63】
- `GET /api/me` — Return the authenticated user email; responds `401` when unauthenticated. 【F:src/app/api/me/route.ts†L1-L24】
- `GET/POST/PATCH/DELETE /api/admin/updates` — Admin-only CRUD for marketing updates with slug de-duplication and featured-cap enforcement. 【F:src/app/api/admin/updates/route.ts†L1-L205】

## Notes
- Middleware-based auth is defined in `src/proxy.ts`; ensure it is exported from `middleware.ts` in production if using a custom filename. 【F:src/proxy.ts†L1-L51】
- Sample scorecards and factors live in `src/lib/data.ts` and drive the default tabs in the workbench. 【F:src/lib/data.ts†L1-L38】
