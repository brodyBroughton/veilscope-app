// src/app/forgot-password/verify/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data as any).error || "Failed to reset password.");
      }

      setMessage(
        data.message || "Password updated successfully. You can now sign in."
      );

      setTimeout(() => {
        router.push("/login?reset=1");
      }, 1200);
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
        <h1 className="text-2xl font-bold mb-2">Enter reset code</h1>
        <p className="text-sm text-[var(--ink-2,#9ca3af)] mb-6">
          We&apos;ve emailed a 6-digit code to your address. Enter it below
          along with your new password.
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

          <div>
            <label className="block text-sm font-medium mb-1">
              Reset code
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              className="w-full h-11 rounded-lg border border-[var(--ui,#1e293b)] bg-[var(--panel-2,#020617)] px-3 text-sm tracking-[0.35em] text-center outline-none focus:ring-2 focus:ring-[var(--accent,#ec4899)]"
              placeholder="123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              New password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--ui,#1e293b)] bg-[var(--panel-2,#020617)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent,#ec4899)]"
              placeholder="Enter a new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--ui,#1e293b)] bg-[var(--panel-2,#020617)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent,#ec4899)]"
              placeholder="Repeat new password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-sm font-semibold text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Updating password…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
