"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAuthPath, prefersReducedMotion } from "@/lib/view-transition";
import { useLandingAuthTransition } from "./LandingAuthTransition";

type TransitionLinkProps = React.ComponentProps<typeof Link>;

export function TransitionLink({
  href,
  onClick,
  ...props
}: TransitionLinkProps) {
  const pathname = usePathname();
  const { startTransition } = useLandingAuthTransition();
  const target = typeof href === "string" ? href : href.pathname ?? "";

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;

    const fromLanding = pathname === "/";
    const toAuth = isAuthPath(target);
    if (!fromLanding || !toAuth) return;

    e.preventDefault();

    if (prefersReducedMotion()) {
      startTransition(target);
      return;
    }

    startTransition(target);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
