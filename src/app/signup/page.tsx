"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { GoogleButton } from "@/components/AuthButtons";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = email && pw.length >= 8 && confirm.length >= 8;

  function ToggleButton({
    pressed,
    onClick,
    label,
  }: { pressed: boolean; onClick: () => void; label: string }) {
    return (
      <button
        type="button"
        aria-pressed={pressed}
        onClick={onClick}
        className="text-sm font-semibold text-[var(--accent)] hover:underline"
        aria-label={label}
      >
        {pressed ? "Hide" : "Show"}
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (pw !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    startTransition(async () => {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password: pw }),
      });

      if (!res.ok) {
        setError("Sign up failed. That email may already be in use.");
        return;
      }

      // Auto-login after successful signup → app home.
      const signed = await signIn("credentials", {
        email: normalizedEmail,
        password: pw,
        redirect: false,
        callbackUrl: "/",
      });

      if (signed?.ok) {
        window.location.href = signed.url ?? "/";
      } else {
        // Fallback: send to login if auto-login hiccups.
        window.location.href = "/login";
      }
    });
  }

  return (
    <div className="fixed inset-0 flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: marketing / brand */}
        <section className="hidden rounded-2xl border border-[var(--ui)] bg-[var(--panel)] p-8 text-[var(--ink)] shadow-[0_16px_60px_rgba(2,8,23,.15)] md:block">
          <div className="mb-6 flex items-center gap-3">
            <img src="/assets/img/logos/veilscope-logo-dark.svg" alt="Veilscope" className="h-6 dark:hidden" />
            <img src="/assets/img/logos/veilscope-logo-light.svg" alt="Veilscope" className="hidden h-6 dark:block" />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Create your Veilscope account</h1>
          <p className="mb-6 text-[var(--ink-2)]">
            Start exploring automated scorecards and saved portfolios. You can switch to Google anytime.
          </p>
          <ul className="grid gap-2 text-sm text-[var(--ink-2)]">
            <li>• One account for web app access</li>
            <li>• Sign in with Google or email</li>
            <li>• Easily manage your portfolio</li>
          </ul>
        </section>

        {/* Right: form card */}
        <section className="rounded-2xl border border-[var(--ui)] bg-[var(--panel)] p-6 text-[var(--ink)] shadow-[0_16px_60px_rgba(2,8,23,.15)]">
          <h2 className="mb-2 text-xl font-extrabold">Create account</h2>
          <p className="mb-4 text-sm text-[var(--ink-2)]">Use Google or an email + password.</p>

          <div className="mb-4">
            <GoogleButton callbackUrl="/" />
          </div>

          <div className="my-4 flex items-center gap-4 text-xs text-[var(--ink-2)]">
            <div className="h-px flex-1 bg-[var(--ui)]" />
            <span>or</span>
            <div className="h-px flex-1 bg-[var(--ui)]" />
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-semibold">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-[var(--ink)] outline-none focus:ring-2"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Password</span>
                <ToggleButton
                  pressed={showPw}
                  onClick={() => setShowPw((v) => !v)}
                  label="Show or hide password"
                />
              </div>
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-[var(--ink)] outline-none focus:ring-2"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Confirm Password</span>
                <ToggleButton
                  pressed={showConfirm}
                  onClick={() => setShowConfirm((v) => !v)}
                  label="Show or hide confirm password"
                />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-[var(--ink)] outline-none focus:ring-2"
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="mt-1 rounded-md bg-red-500/10 px-2 py-1 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || pending}
              className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-bold text-white disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create account"}
            </button>
          </form>

          <div className="mt-4 text-sm text-[var(--ink-2)]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
