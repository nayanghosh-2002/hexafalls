"use client";

import { createPortal } from "react-dom";
import { motion, type MotionValue } from "framer-motion";
import { BoMascot } from "@/components/BoMascot";

export type BoStartSnapshot = {
  startX: number;
  startY: number;
  startSize: number;
};

export type FlightEnd = {
  endX: number;
  endY: number;
};

export function measureFlightEnd(): FlightEnd | null {
  const panel = document.querySelector<HTMLElement>("[data-auth-slide-panel]");
  if (!panel) return null;

  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  const target = document.querySelector<HTMLElement>(
    isDesktop ? "[data-auth-bo-target]" : "[data-auth-bo-mobile-target]"
  );
  if (!target) return null;

  const targetRect = target.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();

  return {
    endX: targetRect.left + targetRect.width / 2 - panelRect.left,
    endY: targetRect.top + targetRect.height / 2 - panelRect.top,
  };
}

/** Flying Bo — position only, constant size (no scale shrink/grow). */
export function FlyingBo({
  x,
  y,
  size,
  visible,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  size: number;
  visible: boolean;
}) {
  if (!visible || size <= 0) return null;

  return createPortal(
    <motion.div
      className="pointer-events-none fixed z-[600] will-change-transform"
      style={{ left: x, top: y, x: "-50%", y: "-50%" }}
      aria-hidden
    >
      <BoMascot
        size={size}
        intensity="normal"
        interactive={false}
        enterAnimation={false}
        priority
      />
    </motion.div>,
    document.body
  );
}

function BoGlow({ size }: { size: number }) {
  const glow = Math.round(size * 1.15);

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 opacity-60"
      style={{
        width: glow,
        height: glow,
        background:
          "radial-gradient(ellipse 75% 70% at 50% 55%, rgba(46,144,237,0.14) 0%, transparent 72%)",
      }}
      aria-hidden
    />
  );
}

export { BoGlow };
