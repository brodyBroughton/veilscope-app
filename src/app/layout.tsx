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
      {/* Preserve the existing app shell styling; the login overlay renders above it. */}
      <body className="webapp">{children}</body>
    </html>
  );
}
