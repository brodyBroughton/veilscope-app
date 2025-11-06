// prisma.config.ts
import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Your Prisma schema file
  schema: path.join("prisma", "schema.prisma"),

  // Migrations folder (optional; uses default if not set)
  migrations: {
    path: path.join("prisma", "migrations"),
    // you can add `seed: "tsx prisma/seed.ts"` here if you have a seed script
  },

  // Datasource configuration (optional if you rely on env only)
  datasource: {
    url: process.env.DATABASE_URL ?? "",   // fallback if env var missing
  },
});
