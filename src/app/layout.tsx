// Server Component
import "@/styles/globals.css";          // your Tailwind v4 + variables
import "@/styles/webapp.css";           // paste your Webapp CSS into src/styles/webapp.css
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Veilscope — App",
  description: "AI Investment Algorithm Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="system">
      <body className="webapp">{children}</body>
    </html>
  );
}
