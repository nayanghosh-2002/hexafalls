"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NavBar } from "@/components/Nav";
import { PasswordInput } from "@/components/PasswordInput";
import { updatePassword, signOut } from "@/lib/auth";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setInitError("Supabase is not configured.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const oauthError = params.get("error_description") ?? params.get("error");

    if (oauthError) {
      setInitError(oauthError);
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setInitError(exchangeError.message);
        } else {
          setReady(true);
        }
      });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      await signOut();
      router.replace("/login?reset=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  if (initError) {
    return (
      <div className="animate-fade-in min-h-screen">
        <NavBar />
        <div className="flex min-h-[calc(100vh-59px)] items-center justify-center px-6 text-center">
          <div className="max-w-[440px]">
            <p className="mb-2 text-lg font-semibold text-foreground">
              Reset link invalid or expired
            </p>
            <p className="mb-6 text-sm text-muted">{initError}</p>
            <Link href="/forgot-password" className="text-sm font-semibold text-primary">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Verifying reset link…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-screen">
      <NavBar />

      <div className="flex min-h-[calc(100vh-59px)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-[440px]">
          <h1 className="mb-2 text-[34px] font-bold tracking-tight text-foreground">
            Choose a new password
          </h1>
          <p className="mb-10 text-[15px] leading-relaxed text-muted">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="mb-2.5 block text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
                New password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="mb-7">
              <label className="mb-2.5 block text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
                Confirm password
              </label>
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error ? (
              <p className="mb-4 text-sm text-red-600">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[10px] bg-primary py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
