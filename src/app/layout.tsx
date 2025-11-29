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
      {/* Body is now just a simple root container; the .webapp layout lives on the inner shell */}
      <body className="app-root">{children}</body>
    </html>
  );
}