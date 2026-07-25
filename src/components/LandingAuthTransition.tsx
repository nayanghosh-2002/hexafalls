"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  animate,
  motion,
  useMotionValue,
  type MotionValue,
} from "framer-motion";
import { AuthSlidePanel } from "@/components/AuthSlidePanel";
import {
  FlyingBo,
  measureFlightEnd,
  type BoStartSnapshot,
} from "@/components/BoAuthHandoff";
import {
  LANDING_AUTH_DURATION,
  LANDING_AUTH_EASE,
  isAuthPath,
  prefersReducedMotion,
} from "@/lib/view-transition";

type LandingAuthTransitionContextValue = {
  isSliding: boolean;
  slideX: MotionValue<string>;
  fromLandingSlide: boolean;
  suppressAuthBo: boolean;
  handoffBoSize: number | null;
  startTransition: (href: string) => void;
};

const LandingAuthTransitionContext =
  createContext<LandingAuthTransitionContextValue>({
    isSliding: false,
    slideX: null as unknown as MotionValue<string>,
    fromLandingSlide: false,
    suppressAuthBo: false,
    handoffBoSize: null,
    startTransition: () => {},
  });

export function useLandingAuthTransition() {
  return useContext(LandingAuthTransitionContext);
}

function snapshotHeroBo(): BoStartSnapshot | null {
  const hero = document.querySelector<HTMLElement>("[data-bo-hero]");
  if (!hero) return null;

  const rect = hero.getBoundingClientRect();
  return {
    startX: rect.left + rect.width / 2,
    startY: rect.top + rect.height / 2,
    startSize: Math.round(Math.max(rect.width, rect.height)),
  };
}

export function LandingAuthTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const slideX = useMotionValue("0vw");
  const boX = useMotionValue(0);
  const boY = useMotionValue(0);

  const [isSliding, setIsSliding] = useState(false);
  const [targetHref, setTargetHref] = useState<string | null>(null);
  const [fromLandingSlide, setFromLandingSlide] = useState(false);
  const [flyingBoVisible, setFlyingBoVisible] = useState(false);
  const [flyingBoSize, setFlyingBoSize] = useState(0);
  const [handoffBoSize, setHandoffBoSize] = useState<number | null>(null);
  const [suppressAuthBo, setSuppressAuthBo] = useState(false);
  const navigating = useRef(false);
  const safetyTimer = useRef<number | null>(null);

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimer.current) {
      window.clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearSafetyTimer();
    slideX.set("0vw");
    setIsSliding(false);
    setTargetHref(null);
    navigating.current = false;
    document.documentElement.classList.remove("slide-active");
  }, [slideX, clearSafetyTimer]);

  const clearFlyingBo = useCallback(() => {
    setFlyingBoVisible(false);
    setFlyingBoSize(0);
    setSuppressAuthBo(false);
    document.querySelector<HTMLElement>("[data-bo-hero]")?.classList.remove("invisible");
    window.setTimeout(() => setFromLandingSlide(false), 200);
  }, []);

  useEffect(() => {
    if (!isAuthPath(pathname)) setHandoffBoSize(null);
  }, [pathname]);

  // Never leave the slide overlay on screen once an auth route is active.
  useEffect(() => {
    if (!isAuthPath(pathname)) return;

    document.documentElement.classList.remove("slide-active");

    if (isSliding) {
      finish();
      setSuppressAuthBo(false);
      clearFlyingBo();
    }
  }, [pathname, isSliding, finish, clearFlyingBo]);

  const startTransition = useCallback(
    (href: string) => {
      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }

      router.prefetch(href);
      slideX.set("0vw");
      navigating.current = false;

      const start = snapshotHeroBo();

      flushSync(() => {
        document.documentElement.classList.add("slide-active");
        setTargetHref(href);
        setIsSliding(true);
        if (start) setSuppressAuthBo(true);
      });

      const end = start ? measureFlightEnd() : null;

      if (start && end) {
        boX.set(start.startX);
        boY.set(start.startY);

        flushSync(() => {
          setFlyingBoSize(start.startSize);
          setHandoffBoSize(start.startSize);
          setFlyingBoVisible(true);
        });

        document.querySelector<HTMLElement>("[data-bo-hero]")?.classList.add("invisible");

        animate(boX, end.endX, {
          duration: LANDING_AUTH_DURATION,
          ease: LANDING_AUTH_EASE,
        });
        animate(boY, end.endY, {
          duration: LANDING_AUTH_DURATION,
          ease: LANDING_AUTH_EASE,
        });
      }

      animate(slideX, "-100vw", {
        duration: LANDING_AUTH_DURATION,
        ease: LANDING_AUTH_EASE,
        onComplete: () => {
          if (navigating.current) return;
          navigating.current = true;
          setFromLandingSlide(true);
          router.push(href);
        },
      });

      clearSafetyTimer();
      safetyTimer.current = window.setTimeout(() => {
        if (!navigating.current) {
          navigating.current = true;
          setFromLandingSlide(true);
          router.push(href);
        }
        finish();
        setSuppressAuthBo(false);
        clearFlyingBo();
      }, (LANDING_AUTH_DURATION + 0.75) * 1000);
    },
    [router, slideX, boX, boY, finish, clearFlyingBo, clearSafetyTimer]
  );

  useEffect(() => {
    if (!isSliding || !targetHref || !navigating.current) return;

    const targetPath = targetHref.split("?")[0];
    if (pathname !== targetPath) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        finish();
        setSuppressAuthBo(false);
        requestAnimationFrame(() => {
          clearFlyingBo();
        });
      });
    });
  }, [pathname, isSliding, targetHref, finish, clearFlyingBo]);

  return (
    <LandingAuthTransitionContext.Provider
      value={{
        isSliding,
        slideX,
        fromLandingSlide,
        suppressAuthBo,
        handoffBoSize,
        startTransition,
      }}
    >
      {children}
      {isSliding && targetHref ? (
        <>
          <div className="pointer-events-none fixed inset-0 z-[499] overflow-hidden" aria-hidden />
          <motion.div
            data-auth-slide-panel
            className="pointer-events-none fixed inset-y-0 z-[500] w-screen overflow-hidden bg-background will-change-transform"
            style={{ left: "100vw", x: slideX }}
            aria-hidden
          >
            <AuthSlidePanel href={targetHref} />
          </motion.div>
        </>
      ) : null}
      <FlyingBo
        x={boX}
        y={boY}
        size={flyingBoSize}
        visible={flyingBoVisible}
      />
    </LandingAuthTransitionContext.Provider>
  );
}
