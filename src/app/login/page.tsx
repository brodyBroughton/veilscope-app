"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { GoogleButton } from "@/components/AuthButtons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });
      if (!res) return setError("Unexpected error. Please try again.");
      if (res.ok) window.location.href = res.url ?? "/";
      else setError("Invalid email or password.");
    });
  }

  return (
    <div className="fixed inset-0 flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left panel */}
        <section className="hidden rounded-2xl border border-[var(--ui)] bg-[var(--panel)] p-8 text-[var(--ink)] shadow-[0_16px_60px_rgba(2,8,23,.15)] md:block">
          <div className="mb-6 flex items-center gap-3">
            <img src="/assets/img/logos/veilscope-logo-dark.svg" alt="Veilscope" className="h-6 dark:hidden" />
            <img src="/assets/img/logos/veilscope-logo-light.svg" alt="Veilscope" className="hidden h-6 dark:block" />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Welcome to Veilscope</h1>
          <p className="mb-6 text-[var(--ink-2)]">
            Sign in to access your scorecards, saved portfolios, and the latest 10-K/10-Q analyses.
          </p>
          <ul className="grid gap-2 text-sm text-[var(--ink-2)]">
            <li>• Curated risk factor breakdowns</li>
            <li>• Clean, VS-Code style workspace</li>
            <li>• Fast navigation across filings</li>
          </ul>
        </section>

        {/* Right: Auth card */}
        <section className="rounded-2xl border border-[var(--ui)] bg-[var(--panel)] p-6 text-[var(--ink)] shadow-[0_16px_60px_rgba(2,8,23,.15)]">
          <h2 className="mb-2 text-xl font-extrabold">Sign in</h2>
          <p className="mb-4 text-sm text-[var(--ink-2)]">Continue with Google or use your email and password.</p>

          <div className="mb-4">
            <GoogleButton callbackUrl="/" />
          </div>

          <div className="my-4 flex items-center gap-4 text-xs text-[var(--ink-2)]">
            <div className="h-px flex-1 bg-[var(--ui)]" />
            <span>or</span>
            <div className="h-px flex-1 bg-[var(--ui)]" />
          </div>

          <form onSubmit={handleCredentials} className="grid gap-3">
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

            <label className="grid gap-1">
              <span className="text-sm font-semibold">Password</span>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 pr-10 text-[var(--ink)] outline-none focus:ring-2"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-pressed={showPw}
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[var(--ink-2)] hover:bg-[var(--panel)]"
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <p className="mt-1 rounded-md bg-red-500/10 px-2 py-1 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-bold text-white disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-sm text-[var(--ink-2)]">
            Don’t have an account?{" "}
            <Link href="/signup" className="font-bold text-[var(--accent)] hover:underline">
              Create one
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
