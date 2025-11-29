// src/app/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data as any).error || "Failed to request reset code.");
      }

      setMessage(
        data.message ||
          "If an account exists for that email, a reset code will be sent shortly."
      );

      // Small delay then push to verify page
      setTimeout(() => {
        router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`);
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--panel-1,#020617)] border border-[var(--ui,#1e293b)] p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Forgot your password?</h1>
        <p className="text-sm text-[var(--ink-2,#9ca3af)] mb-6">
          Enter the email associated with your Veilscope account and we&apos;ll
          send you a 6-digit reset code.
        </p>

        {message && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--ui,#1e293b)] bg-[var(--panel-2,#020617)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent,#ec4899)]"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-sm font-semibold text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending code…" : "Send reset code"}
          </button>
        </form>

        <p className="mt-6 text-xs text-[var(--ink-2,#9ca3af)]">
          If you sign in with Google, manage your password through your Google
          account instead.
        </p>
      </div>
    </div>
  );
}
