"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { OAuthButtons } from "@/components/AuthButtons";
import { AuthBoPanel } from "@/components/AuthBoPanel";
import { AuthCrossfade } from "@/components/AuthCrossfade";
import { AuthPageProvider, useAuthPage } from "@/components/AuthPageContext";
import { AuthShell } from "@/components/AuthShell";
import { signInWithProvider } from "@/lib/auth";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { resolvePostAuthPath } from "@/lib/user-client";

function authVariant(pathname: string): "login" | "signup" | "forgot" {
  if (pathname === "/signup") return "signup";
  if (pathname === "/forgot-password") return "forgot";
  return "login";
}

// Auth pages are excluded from server-side redirect once the browser restores
// them from bfcache (back/forward navigation resolves entirely client-side,
// so src/middleware.ts never runs). Re-check the session on mount and on
// pageshow(persisted) so an already-logged-in user can't land back on a stale
// login/signup form.
function useRedirectIfAuthenticated() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function redirectIfLoggedIn() {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session) return;
      const next = await resolvePostAuthPath();
      if (!cancelled) router.replace(next);
    }

    redirectIfLoggedIn();

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) redirectIfLoggedIn();
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);
}

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hideOAuth } = useAuthPage();
  useRedirectIfAuthenticated();
  const mode = pathname === "/signup" ? "signup" : "login";
  const showOAuth =
    (pathname === "/login" || pathname === "/signup") && !hideOAuth;
  const variant = authVariant(pathname);

  async function handleOAuth(provider: string) {
    if (provider === "google" || provider === "github") {
      try {
        await signInWithProvider(provider, mode);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not start sign-in.";
        alert(message);
      }
    }
  }

  return (
    <AuthShell aside={<AuthBoPanel variant={variant} />}>
      <div className="auth-card">
        <AuthCrossfade>{children}</AuthCrossfade>
        {showOAuth ? (
          <>
            <div className="my-5 flex items-center gap-3" aria-hidden={false}>
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <OAuthButtons onAuth={handleOAuth} mode={mode} />
          </>
        ) : null}
      </div>
    </AuthShell>
  );
}

export function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthPageProvider>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </AuthPageProvider>
  );
}
