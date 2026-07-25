"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthHeader } from "@/components/AuthShell";
import { resetPasswordForEmail } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resetPasswordForEmail(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeader
        title="Reset your password"
        description="Enter your email and we'll send you a link to choose a new password."
      />

      {sent ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="mb-2 text-[15px] font-semibold text-foreground">
            Check your inbox
          </p>
          <p className="mb-6 text-[14px] leading-relaxed text-muted">
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a
            password reset link shortly.
          </p>
          <Link href="/login" className="text-sm font-semibold text-primary">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="auth-field-group-last">
            <label className="auth-field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="auth-input"
            />
          </div>

          <div className="mb-3 min-h-[18px]">
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <p className="auth-footer-text">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Log in
            </Link>
          </p>
        </form>
      )}
    </>
  );
}
