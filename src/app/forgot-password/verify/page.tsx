// src/app/forgot-password/verify/page.tsx
import VerifyResetClient from "./VerifyResetClient";

type VerifyResetPageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function VerifyResetPage({ searchParams }: VerifyResetPageProps) {
  const rawEmail = searchParams.email;
  const initialEmail =
    typeof rawEmail === "string"
      ? rawEmail
      : Array.isArray(rawEmail)
      ? rawEmail[0] ?? ""
      : "";

  return <VerifyResetClient initialEmail={initialEmail} />;
}