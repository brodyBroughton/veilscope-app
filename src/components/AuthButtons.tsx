"use client";

import { signIn, signOut } from "next-auth/react";

type GoogleButtonProps = {
  callbackUrl?: string;
  label?: string;
};

export function GoogleButton({
  callbackUrl = "/",
  label = "Continue with Google",
}: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--ui)] bg-[var(--panel)] px-4 py-2 font-bold text-[var(--ink)] hover:bg-[var(--panel-2)]"
    >
      <GoogleIcon className="h-5 w-5" />
      {label}
    </button>
  );
}

export function SignOutButton({
  callbackUrl = "/login",
  label = "Sign out",
}: { callbackUrl?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl })}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--ui)] bg-[var(--panel)] px-3 py-2 text-sm font-bold text-[var(--ink)] hover:bg-[var(--panel-2)]"
    >
      {label}
    </button>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 533.5 544.3" aria-hidden="true" {...props}>
      <path fill="#4285f4" d="M533.5 278.4c0-18.5-1.5-37-4.7-54.8H272v103.8h147.4c-6.3 34-25 62.8-53.3 82v68.1h86.2c50.5-46.6 81.2-115.3 81.2-199.1z"/>
      <path fill="#34a853" d="M272 544.3c72.8 0 134-24.3 178.6-66.8l-86.2-68.1c-24 16.1-55 25.6-92.4 25.6-70.8 0-130.8-47.7-152.4-111.9H30.6v70.3c44.4 88 135.5 150.9 241.4 150.9z"/>
      <path fill="#fbbc04" d="M119.6 323.1c-10.2-30.6-10.2-63.6 0-94.2V158.6H30.6c-41.1 81.9-41.1 179.6 0 261.5l89-70.9z"/>
      <path fill="#ea4335" d="M272 107.7c39.6-.6 77.8 14.2 106.7 41.4l79.7-79.7C410.7 26.8 343.9-1.3 272 0 166.1 0 75 62.9 30.6 150.9l89 70.3C141.2 155.9 201.2 108.3 272 107.7z"/>
    </svg>
  );
}
