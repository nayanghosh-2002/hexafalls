"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type SpringOptions,
  type Transition,
} from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef } from "react";

/* ─── Intensity presets ───────────────────────────────────────────── */

export type BoAnimationIntensity = "subtle" | "normal" | "lively";

type IntensityConfig = {
  floatY: number;
  breatheMin: number;
  breatheMax: number;
  rotate: number;
  leanX: number;
  leanY: number;
  leanRotate: number;
  hoverScale: number;
  tapScaleX: number;
  tapScaleY: number;
  shadowOpacity: [number, number, number];
  shadowScaleX: [number, number, number];
  floatDuration: number;
  breatheDuration: number;
  rotateDuration: number;
};

const INTENSITY: Record<BoAnimationIntensity, IntensityConfig> = {
  subtle: {
    floatY: 4,
    breatheMin: 0.995,
    breatheMax: 1.005,
    rotate: 1.2,
    leanX: 3,
    leanY: 2,
    leanRotate: 1.5,
    hoverScale: 1.02,
    tapScaleX: 0.985,
    tapScaleY: 0.975,
    shadowOpacity: [0.1, 0.15, 0.1],
    shadowScaleX: [1, 0.94, 1],
    floatDuration: 6.2,
    breatheDuration: 4.8,
    rotateDuration: 8.5,
  },
  normal: {
    floatY: 6,
    breatheMin: 0.99,
    breatheMax: 1.01,
    rotate: 2,
    leanX: 5,
    leanY: 3.5,
    leanRotate: 2.5,
    hoverScale: 1.03,
    tapScaleX: 0.98,
    tapScaleY: 0.965,
    shadowOpacity: [0.12, 0.2, 0.12],
    shadowScaleX: [1, 0.9, 1],
    floatDuration: 5.5,
    breatheDuration: 4.2,
    rotateDuration: 7.5,
  },
  lively: {
    floatY: 8,
    breatheMin: 0.988,
    breatheMax: 1.012,
    rotate: 2.5,
    leanX: 7,
    leanY: 5,
    leanRotate: 3,
    hoverScale: 1.035,
    tapScaleX: 0.975,
    tapScaleY: 0.96,
    shadowOpacity: [0.14, 0.24, 0.14],
    shadowScaleX: [1, 0.86, 1],
    floatDuration: 4.8,
    breatheDuration: 3.6,
    rotateDuration: 6.8,
  },
};

/* ─── Springs ───────────────────────────────────────────────────── */

const LEAN_SPRING: SpringOptions = { stiffness: 160, damping: 22, mass: 0.85 };
const HOVER_SPRING: SpringOptions = { stiffness: 280, damping: 24, mass: 0.65 };
const TAP_SPRING: SpringOptions = { stiffness: 520, damping: 30, mass: 0.55 };

const BO_IMAGES = {
  default: "/bo-mascot.png",
  whistle: "/bo-whistle.png",
  excited: "/bo-excited.png",
} as const;

/** Vertical nudge per pose — normalised to canvas height (1024px) so feet align. */
const POSE_OFFSET_Y = {
  default: 0,
  whistle: -((841 - 798) / 1024),
  excited: -((849 - 798) / 1024),
} as const;

const ORGANIC_EASE = [0.45, 0.05, 0.55, 0.95] as const;
const ENTRY_EASE = [0.16, 1, 0.3, 1] as const;
const POSE_CROSSFADE: Transition = {
  duration: 0.85,
  ease: [0.22, 1, 0.36, 1],
};

/* ─── Props ───────────────────────────────────────────────────────── */

export type BoMascotProps = {
  /** Render width & height in px. Default 120. */
  size?: number;
  /** Motion amplitude preset. Default "normal". */
  intensity?: BoAnimationIntensity;
  /** Lean toward cursor on hover. Default true. */
  interactive?: boolean;
  /** Turn away — e.g. while user types a password. */
  lookAway?: boolean;
  /** Restrained delight — e.g. hovering a CTA. */
  excited?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  priority?: boolean;
  /** Play the fade-in entrance on mount. Off for auth / handoff Bo. */
  enterAnimation?: boolean;
};

/* ─── Component ───────────────────────────────────────────────────── */

export function BoMascot({
  size = 120,
  intensity = "normal",
  interactive = true,
  lookAway = false,
  excited = false,
  className = "",
  onClick,
  ariaLabel = "Bo, Sealit mascot",
  priority = false,
  enterAnimation = true,
}: BoMascotProps) {
  const config = INTENSITY[intensity];
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const leanRotate = useMotionValue(0);

  const springX = useSpring(pointerX, LEAN_SPRING);
  const springY = useSpring(pointerY, LEAN_SPRING);
  const springRotate = useSpring(leanRotate, LEAN_SPRING);

  const resetLean = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
    leanRotate.set(0);
    isHovered.current = false;
  }, [pointerX, pointerY, leanRotate]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || lookAway || prefersReducedMotion) return;

      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (rect.width / 2);
      const ny = (e.clientY - cy) / (rect.height / 2);

      pointerX.set(nx * config.leanX);
      pointerY.set(ny * config.leanY);
      leanRotate.set(nx * config.leanRotate);
    },
    [interactive, lookAway, prefersReducedMotion, pointerX, pointerY, leanRotate, config],
  );

  useEffect(() => {
    if (lookAway) resetLean();
  }, [lookAway, resetLean]);

  const floatTransition: Transition = useMemo(
    () => ({
      duration: excited ? config.floatDuration * 0.85 : config.floatDuration,
      repeat: Infinity,
      ease: ORGANIC_EASE,
    }),
    [config.floatDuration, excited],
  );

  const breatheTransition: Transition = useMemo(
    () => ({
      duration: excited ? config.breatheDuration * 0.75 : config.breatheDuration,
      repeat: Infinity,
      ease: "easeInOut",
    }),
    [config.breatheDuration, excited],
  );

  const rotateTransition: Transition = useMemo(
    () => ({
      duration: config.rotateDuration,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1],
    }),
    [config.rotateDuration],
  );

  const shadowTransition: Transition = useMemo(
    () => ({
      duration: config.floatDuration,
      repeat: Infinity,
      ease: ORGANIC_EASE,
    }),
    [config.floatDuration],
  );

  const idleFloat = prefersReducedMotion ? { y: 0 } : { y: [0, -config.floatY, 0] };

  const idleBreathe = prefersReducedMotion
    ? { scale: 1 }
    : excited
      ? { scale: [1, 1.012, 1] }
      : { scale: [1, config.breatheMax, config.breatheMin, 1] };

  const idleRotate = prefersReducedMotion
    ? { rotate: 0 }
    : { rotate: [-config.rotate, config.rotate, -config.rotate] };

  const shadowWidth = size * 0.52;
  const shadowHeight = size * 0.07;

  const showDefault = !lookAway && !excited;

  const Wrapper = onClick ? motion.button : motion.div;

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? ariaLabel : undefined}
      className={`relative inline-flex select-none items-end justify-center border-0 bg-transparent p-0 ${
        onClick
          ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          : ""
      } ${className}`}
      style={{ width: size, height: size * 1.05 }}
      initial={
        enterAnimation && !prefersReducedMotion
          ? { opacity: 0, y: 20, scale: 0.95 }
          : false
      }
      animate={
        enterAnimation && !prefersReducedMotion
          ? { opacity: 1, y: 0, scale: 1 }
          : undefined
      }
      transition={enterAnimation ? { duration: 0.8, ease: ENTRY_EASE } : undefined}
    >
      {/* Ground shadow — breathes with float */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute rounded-[50%] bg-[#1B3A6B]"
        style={{
          width: shadowWidth,
          height: shadowHeight,
          left: "50%",
          bottom: size * 0.01,
          x: "-50%",
          filter: "blur(10px)",
          willChange: "transform, opacity",
        }}
        animate={
          prefersReducedMotion || lookAway
            ? { opacity: lookAway ? 0.08 : 0.14, scaleX: lookAway ? 0.88 : 1, y: 0 }
            : {
                y: [0, config.floatY * 0.35, 0],
                scaleX: config.shadowScaleX,
                opacity: config.shadowOpacity,
              }
        }
        transition={prefersReducedMotion || lookAway ? POSE_CROSSFADE : shadowTransition}
      />

      {/* Float layer */}
      <motion.div
        className="relative flex w-full items-end justify-center"
        style={{ height: size, willChange: "transform" }}
        animate={lookAway ? (prefersReducedMotion ? { y: 0 } : { y: [0, -3, 0] }) : idleFloat}
        transition={
          lookAway
            ? prefersReducedMotion
              ? POSE_CROSSFADE
              : { duration: 4.5, repeat: Infinity, ease: ORGANIC_EASE }
            : floatTransition
        }
      >
        {/* Breathe + idle rotation */}
        <motion.div
          animate={
            lookAway
              ? prefersReducedMotion
                ? { scale: 1, rotate: 0 }
                : { scale: [1, 1.008, 1], rotate: 0 }
              : { ...idleBreathe, ...idleRotate }
          }
          transition={
            lookAway
              ? {
                  rotate: POSE_CROSSFADE,
                  scale: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                }
              : {
                  scale: breatheTransition,
                  rotate: rotateTransition,
                }
          }
          style={{ willChange: "transform", originX: 0.5, originY: 0.85 }}
        >
          {/* Cursor lean + hover + tap */}
          <motion.div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => {
              isHovered.current = true;
            }}
            onPointerLeave={resetLean}
            style={{
              x: lookAway ? 0 : springX,
              y: lookAway ? 0 : springY,
              rotate: lookAway ? 0 : springRotate,
              willChange: "transform",
            }}
            whileHover={
              lookAway || prefersReducedMotion
                ? undefined
                : { scale: config.hoverScale, transition: HOVER_SPRING }
            }
            whileTap={
              lookAway || prefersReducedMotion
                ? undefined
                : {
                    scaleX: config.tapScaleX,
                    scaleY: config.tapScaleY,
                    transition: TAP_SPRING,
                  }
            }
          >
            <div
              className="relative"
              style={{ width: size, height: size, willChange: "opacity" }}
            >
              <BoPoseLayer
                src={BO_IMAGES.default}
                alt={onClick ? "" : ariaLabel}
                size={size}
                show={showDefault}
                offsetY={POSE_OFFSET_Y.default}
                priority={priority}
              />
              {lookAway ? (
                <BoPoseLayer
                  src={BO_IMAGES.whistle}
                  alt="Bo whistling and looking away"
                  size={size}
                  show
                  offsetY={POSE_OFFSET_Y.whistle}
                  priority={priority}
                />
              ) : null}
              {excited ? (
                <BoPoseLayer
                  src={BO_IMAGES.excited}
                  alt="Bo excited and cheering you on"
                  size={size}
                  show
                  offsetY={POSE_OFFSET_Y.excited}
                  priority={false}
                  fadeIn
                />
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Wrapper>
  );
}

function BoPoseLayer({
  src,
  alt,
  size,
  show,
  offsetY,
  priority,
  fadeIn = false,
}: {
  src: string;
  alt: string;
  size: number;
  show: boolean;
  offsetY: number;
  priority: boolean;
  fadeIn?: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ y: offsetY * size, willChange: "opacity" }}
      animate={{ opacity: show ? 1 : 0 }}
      initial={{ opacity: fadeIn ? 0 : show ? 1 : 0 }}
      transition={POSE_CROSSFADE}
      aria-hidden={!show}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="pointer-events-none h-full w-full object-contain object-bottom"
        priority={priority}
        draggable={false}
      />
    </motion.div>
  );
}
