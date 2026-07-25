export const AUTH_HANDOFF_KEY = "sealit-auth-handoff";

/** Shared landing → auth slide + Bo flight duration (seconds). */
export const LANDING_AUTH_DURATION = 0.32;
export const LANDING_AUTH_EASE = [0.22, 1, 0.36, 1] as const;

const AUTH_PATHS = ["/login", "/signup", "/forgot-password"];

export function isAuthPath(href: string): boolean {
  const path = href.split("?")[0];
  return AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
