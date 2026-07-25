"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthBoMobile } from "@/components/AuthBoPanel";
import { AuthHeader } from "@/components/AuthShell";
import { useBoExcited } from "@/components/BoContext";
import { PasswordInput } from "@/components/PasswordInput";
import { signInWithEmail } from "@/lib/auth";
import { resolvePostAuthPath } from "@/lib/user-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onMouseEnter, onMouseLeave } = useBoExcited(loading);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmail(email, password);
      const next = await resolvePostAuthPath();
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeader
        title="Welcome back."
        description="Sign in to your personalized problem feed."
      />

      <AuthBoMobile />

      {resetSuccess ? (
        <p className="mb-4 rounded-lg border border-primary/20 bg-primary-light px-4 py-3 text-sm text-primary">
          Password updated. Sign in with your new password.
        </p>
      ) : null}

      <form onSubmit={handleLogin}>
        <div className="auth-field-group">
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

        <div className="auth-field-group-last">
          <label className="auth-field-label">Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <div className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-primary">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="mb-3 min-h-[18px]">
          {error || authError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error ?? authError}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="auth-btn-primary"
        >
          <span className="min-w-[6.5rem]">{loading ? "Signing in…" : "Sign in"}</span>
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[252px] animate-pulse rounded-lg bg-surface-muted" />}>
      <LoginForm />
    </Suspense>
  );
}
