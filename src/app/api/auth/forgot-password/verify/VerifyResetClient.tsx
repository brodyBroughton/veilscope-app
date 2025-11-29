// src/app/forgot-password/verify/VerifyResetClient.tsx
"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyResetClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !code || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

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

      setMessage("Password updated successfully. You can now sign in.");
      // Optional redirect:
      // setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 👉 Replace the markup below with whatever styling you already had
  return (
    <div className="forgot-container">
      <h1 className="forgot-title">Reset your password</h1>

      <form className="forgot-form" onSubmit={handleSubmit}>
        {error && <p className="forgot-error">{error}</p>}
        {message && <p className="forgot-success">{message}</p>}

        <div className="forgot-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="forgot-field">
          <label>Verification code</label>
          <input
            type="text"
            value={code}
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div className="forgot-field">
          <label>New password</label>
          <input
            type="password"
            value={newPassword}
            autoComplete="new-password"
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="forgot-field">
          <label>Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
