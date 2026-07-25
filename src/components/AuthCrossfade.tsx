"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLandingAuthTransition } from "@/components/LandingAuthTransition";

const FADE_MS = 200;

export function AuthCrossfade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { fromLandingSlide } = useLandingAuthTransition();
  const [current, setCurrent] = useState({ path: pathname, node: children });
  const [previous, setPrevious] = useState<{ path: string; node: ReactNode } | null>(
    null
  );
  const [visible, setVisible] = useState(true);
  const isFirstRender = useRef(true);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setCurrent({ path: pathname, node: children });
      if (fromLandingSlide) setVisible(true);
      return;
    }

    if (pathname === currentRef.current.path) {
      setCurrent({ path: pathname, node: children });
      return;
    }

    setPrevious(currentRef.current);
    setCurrent({ path: pathname, node: children });
    setVisible(false);

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

    const timer = window.setTimeout(() => {
      setPrevious(null);
    }, FADE_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [pathname, children, fromLandingSlide]);

  return (
    <div className="relative min-h-[252px]">
      {previous ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity ease-in-out"
          style={{
            opacity: visible ? 0 : 1,
            transitionDuration: `${FADE_MS}ms`,
          }}
        >
          {previous.node}
        </div>
      ) : null}
      <div
        className="relative transition-opacity ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transitionDuration: `${FADE_MS}ms`,
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        {current.node}
      </div>
    </div>
  );
}
