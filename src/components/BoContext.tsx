"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type BoContextValue = {
  passwordHidden: boolean;
  setPasswordHidden: (hidden: boolean) => void;
  excited: boolean;
  setExcited: (excited: boolean) => void;
};

const BoContext = createContext<BoContextValue | null>(null);

export function BoProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [passwordHidden, setPasswordHidden] = useState(false);
  const [excited, setExcited] = useState(false);

  useEffect(() => {
    setExcited(false);
    setPasswordHidden(false);
  }, [pathname]);

  const value = useMemo(
    () => ({ passwordHidden, setPasswordHidden, excited, setExcited }),
    [passwordHidden, excited],
  );

  return <BoContext.Provider value={value}>{children}</BoContext.Provider>;
}

export function useBo() {
  const ctx = useContext(BoContext);
  if (!ctx) {
    throw new Error("useBo must be used within BoProvider");
  }
  return ctx;
}

/** Spread onto buttons that should make Bo excited on hover / submit. */
export function useBoExcited(loading = false) {
  const { setExcited } = useBo();

  const onMouseEnter = useCallback(() => setExcited(true), [setExcited]);
  const onMouseLeave = useCallback(() => {
    if (!loading) setExcited(false);
  }, [loading, setExcited]);

  return { onMouseEnter, onMouseLeave, setExcited };
}
