// src/app/layout.tsx — Server Component
import "@/styles/globals.css";
import "@/styles/webapp.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Veilscope — App",
  description: "AI Investment Algorithm Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="system">
      {/* We keep body.webapp to preserve your existing app shell styles.
          The Login page uses a fixed overlay so it won't be affected by the grid. */}
      <body className="webapp">{children}</body>
    </html>
  );
}
