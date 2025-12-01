// src/app/forgot-password/verify/page.tsx
import VerifyResetClient from "./VerifyResetClient";

type VerifyResetPageProps = {
  // In this Next.js version, searchParams is a Promise-like
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function VerifyResetPage({
  searchParams,
}: VerifyResetPageProps) {
  const sp = await searchParams;

  const rawEmail = sp.email;
  const initialEmail =
    typeof rawEmail === "string"
      ? rawEmail
      : Array.isArray(rawEmail)
      ? rawEmail[0] ?? ""
      : "";

  return <VerifyResetClient initialEmail={initialEmail} />;
}