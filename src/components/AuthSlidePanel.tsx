"use client";

import {
  AuthBoMobileTargetMarker,
  AuthBoTargetMarker,
} from "@/components/AuthBoTargetMarker";
import { AuthHeader, AuthShell } from "@/components/AuthShell";
import { GitHubIcon, GoogleIcon, OAuthIconSlot } from "@/components/OAuthIcons";

type AuthVariant = "login" | "signup" | "forgot";

function authVariantFromHref(href: string): AuthVariant {
  const path = href.split("?")[0];
  if (path === "/signup") return "signup";
  if (path === "/forgot-password") return "forgot";
  return "login";
}

function StaticField({
  label,
  placeholder,
  trailing,
  below,
}: {
  label: string;
  placeholder: string;
  trailing?: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <div className="auth-field-group">
      <div className="mb-1.5 flex min-h-[16px] items-center justify-between">
        <label className="auth-field-label mb-0">{label}</label>
        {trailing}
      </div>
      <div className="auth-input text-muted">{placeholder}</div>
      {below ? <div className="mt-1.5 text-right">{below}</div> : null}
    </div>
  );
}

function OAuthStatic({ mode }: { mode: "login" | "signup" }) {
  return (
    <>
      <div className="auth-btn-google pointer-events-none mt-4">
        <OAuthIconSlot>
          <GoogleIcon />
        </OAuthIconSlot>
        Continue with Google
      </div>
      <div className="auth-btn-github pointer-events-none">
        <OAuthIconSlot>
          <GitHubIcon />
        </OAuthIconSlot>
        Continue with GitHub
      </div>
      <p className="text-center text-[13px] text-muted">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <span className="font-medium text-primary">Sign up</span>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <span className="font-medium text-primary">Log in</span>
          </>
        )}
      </p>
    </>
  );
}

function LoginPreview() {
  return (
    <>
      <AuthHeader
        title="Welcome back."
        description="Sign in to your personalized problem feed."
      />
      <AuthBoMobileTargetMarker />
      <StaticField label="Email" placeholder="you@example.com" />
      <StaticField
        label="Password"
        placeholder="••••••••"
        below={
          <span className="text-xs font-medium text-primary">Forgot password?</span>
        }
      />
      <div className="mb-4 min-h-[20px]" />
      <div className="mb-0 auth-btn-primary pointer-events-none">
        Sign in
      </div>
      <OAuthStatic mode="login" />
    </>
  );
}

function SignupPreview() {
  return (
    <>
      <AuthHeader
        title="Create your account."
        description="Start building from real problems, matched to your stack."
      />
      <AuthBoMobileTargetMarker />
      <StaticField label="Email" placeholder="you@example.com" />
      <StaticField label="Password" placeholder="••••••••" />
      <div className="mb-4 min-h-[20px]" />
      <div className="mb-0 auth-btn-primary pointer-events-none">
        Create account
      </div>
      <OAuthStatic mode="signup" />
    </>
  );
}

function ForgotPreview() {
  return (
    <>
      <AuthHeader
        title="Reset your password"
        description="Enter your email and we'll send you a link to choose a new password."
      />
      <StaticField label="Email" placeholder="you@example.com" />
      <div className="mb-4 min-h-[20px]" />
      <div className="auth-btn-primary pointer-events-none">
        Send reset link
      </div>
      <p className="mt-6 text-center text-[13px] text-muted">
        Remember your password?{" "}
        <span className="font-medium text-primary">Log in</span>
      </p>
    </>
  );
}

export function AuthSlidePanel({ href }: { href: string }) {
  const variant = authVariantFromHref(href);

  return (
    <div className="pointer-events-none h-full min-h-screen select-none bg-background">
      <AuthShell aside={<AuthBoTargetMarker />}>
        <div className="auth-card">
          {variant === "signup" ? (
            <SignupPreview />
          ) : variant === "forgot" ? (
            <ForgotPreview />
          ) : (
            <LoginPreview />
          )}
        </div>
      </AuthShell>
    </div>
  );
}
