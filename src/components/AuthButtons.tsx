"use client";

import Link from "next/link";
import { useBoExcited } from "@/components/BoContext";
import { GitHubIcon, GoogleIcon, OAuthIconSlot } from "@/components/OAuthIcons";

export function OAuthButtons({
  onAuth,
  mode = "login",
}: {
  onAuth: (provider: string) => void;
  mode?: "login" | "signup";
}) {
  const { onMouseEnter, onMouseLeave, setExcited } = useBoExcited();

  function handleOAuth(provider: string) {
    setExcited(true);
    onAuth(provider);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="auth-btn-google"
      >
        <OAuthIconSlot>
          <GoogleIcon />
        </OAuthIconSlot>
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => handleOAuth("github")}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="auth-btn-github"
      >
        <OAuthIconSlot>
          <GitHubIcon />
        </OAuthIconSlot>
        Continue with GitHub
      </button>

      <p className="auth-footer-text">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              className="font-semibold text-primary transition-opacity duration-200 hover:opacity-70"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              className="font-semibold text-primary transition-opacity duration-200 hover:opacity-70"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </>
  );
}
