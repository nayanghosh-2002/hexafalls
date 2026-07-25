"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthBoMobile } from "@/components/AuthBoPanel";
import { AuthHeader } from "@/components/AuthShell";
import { useAuthPage } from "@/components/AuthPageContext";
import { useBoExcited } from "@/components/BoContext";
import { PasswordInput } from "@/components/PasswordInput";
import { POST_SIGNUP_PATH, signUpWithEmail } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const { setHideOAuth } = useAuthPage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { onMouseEnter, onMouseLeave } = useBoExcited(loading);

  useEffect(() => {
    setHideOAuth(confirmationSent);
    return () => setHideOAuth(false);
  }, [confirmationSent, setHideOAuth]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { needsConfirmation } = await signUpWithEmail(email, password);

      if (needsConfirmation) {
        setConfirmationSent(true);
        return;
      }

      router.push(POST_SIGNUP_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeader
        title="Create your account."
        description="Join builders who open Sealit every morning."
      />

      {!confirmationSent ? <AuthBoMobile /> : null}

      {confirmationSent ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="mb-2 text-[15px] font-semibold text-foreground">
            Confirm your email
          </p>
          <p className="mb-6 text-[14px] leading-relaxed text-muted">
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account, then log in.
          </p>
          <Link href="/login" className="text-sm font-semibold text-primary">
            Go to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSignup}>
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
              minLength={6}
            />
          </div>

          <div className="mb-3 min-h-[18px]">
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="auth-btn-primary"
          >
            <span className="min-w-[9rem]">
              {loading ? "Creating account…" : "Create account →"}
            </span>
          </button>
        </form>
      )}
    </>
  );
}
