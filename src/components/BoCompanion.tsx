"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoMascot } from "./BoMascot";
import { useBo } from "./BoContext";

function getBoMessage(pathname: string): string {
  if (pathname === "/") return "Hi! I'm Bo — let's find something worth building.";
  if (pathname.startsWith("/feed")) return "Scroll through — something might click!";
  if (pathname.startsWith("/building")) return "Love seeing you ship things!";
  if (pathname.startsWith("/saved")) return "Your stash of ideas!";
  if (pathname.startsWith("/profile")) return "Looking good!";
  if (pathname.startsWith("/forgot-password")) return "We've all been there. You'll get back in.";
  if (pathname.startsWith("/problem/")) return "This one looks promising!";
  return "I'm here if you need me!";
}

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
}

export function BoCompanion() {
  const pathname = usePathname();

  if (isAuthPage(pathname) || pathname === "/" || pathname === "/feed") return null;

  return <BoCompanionFloating pathname={pathname} />;
}

function BoCompanionFloating({ pathname }: { pathname: string }) {
  const { passwordHidden, excited } = useBo();
  const message = useMemo(() => getBoMessage(pathname), [pathname]);

  const [bubble, setBubble] = useState(message);
  const [visible, setVisible] = useState(false);

  const bubbleText = passwordHidden
    ? "♪ La la la… I didn't see anything."
    : excited
      ? "Let's go!"
      : bubble;

  useEffect(() => {
    setBubble(message);
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (passwordHidden || excited) setVisible(true);
  }, [passwordHidden, excited]);

  const handleClick = useCallback(() => {
    if (passwordHidden) return;
    setBubble(message);
    setVisible((v) => !v);
  }, [message, passwordHidden]);

  const showBubble = visible || passwordHidden || excited;

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[45] sm:bottom-6 sm:right-6"
      aria-hidden={false}
    >
      <div
        className={`pointer-events-auto mb-1 max-w-[220px] transition-all duration-200 sm:max-w-[260px] ${
          showBubble
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <div className="relative rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-[13px] leading-snug text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <p>{bubbleText}</p>
          <span
            className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-border bg-surface"
            aria-hidden
          />
        </div>
      </div>

      <div className="pointer-events-auto flex flex-col items-center">
        <BoMascot
          size={96}
          intensity="subtle"
          interactive={!passwordHidden}
          lookAway={passwordHidden}
          excited={excited && !passwordHidden}
          onClick={handleClick}
          ariaLabel="Bo, your Sealit companion"
        />
        <span className="logo -mt-0.5 text-[11px] font-bold tracking-wide text-primary opacity-80 sm:text-xs">
          Bo
        </span>
      </div>
    </div>
  );
}
