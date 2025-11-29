// src/app/forgot-password/verify/page.tsx
import { Suspense } from "react";
import VerifyResetClient from "./VerifyResetClient";

export const dynamic = "force-static"; // you can omit this; default is static

export default function VerifyResetPage() {
  return (
    <main className="forgot-page">
      <Suspense fallback={<div>Loading reset form…</div>}>
        <VerifyResetClient />
      </Suspense>
    </main>
  );
}
