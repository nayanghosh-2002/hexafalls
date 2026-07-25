"use client";

import { useEffect, useRef, useState } from "react";
import { BoMascot } from "./BoMascot";
import { useBo } from "./BoContext";
import { BoGlow } from "@/components/BoAuthHandoff";
import { useLandingAuthTransition } from "./LandingAuthTransition";

function usePanelBoSize(containerRef: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState(480);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const node = el;
    function measure() {
      const { width, height } = node.getBoundingClientRect();
      const byWidth = width * 0.92;
      const byHeight = height * 0.88;
      setSize(Math.round(Math.min(byWidth, byHeight)));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}

export function AuthBoPanel({
  variant,
  hidden = false,
}: {
  variant: "login" | "signup" | "forgot";
  hidden?: boolean;
}) {
  void variant;
  const panelRef = useRef<HTMLDivElement>(null);
  const boSize = usePanelBoSize(panelRef);
  const { passwordHidden, excited } = useBo();
  const { suppressAuthBo, handoffBoSize } = useLandingAuthTransition();
  const hiddenDuringHandoff = hidden || suppressAuthBo;
  const displaySize = handoffBoSize ?? boSize;

  return (
    <div
      ref={panelRef}
      className="relative flex h-full min-h-[calc(100vh-58px)] w-full items-center justify-center px-4 py-6 lg:px-8"
    >
      <div className="relative">
        <BoGlow size={displaySize} />
        <div data-auth-bo className={hiddenDuringHandoff ? "invisible" : ""}>
          <BoMascot
            size={displaySize}
            intensity="normal"
            interactive={!passwordHidden}
            lookAway={passwordHidden}
            excited={excited && !passwordHidden}
            enterAnimation={false}
            priority
          />
        </div>
      </div>
    </div>
  );
}

/** Compact Bo for mobile auth screens */
export function AuthBoMobile() {
  const { passwordHidden, excited } = useBo();
  const { suppressAuthBo } = useLandingAuthTransition();

  if (suppressAuthBo) {
    return <div className="mb-8 min-h-0 lg:hidden" aria-hidden />;
  }

  return (
    <div className="mb-5 flex justify-center lg:hidden">
      <BoMascot
        size={200}
        intensity="subtle"
        interactive={!passwordHidden}
        lookAway={passwordHidden}
        excited={excited && !passwordHidden}
        enterAnimation={false}
      />
    </div>
  );
}
