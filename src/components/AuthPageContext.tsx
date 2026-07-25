"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface AuthPageContextValue {
  hideOAuth: boolean;
  setHideOAuth: (hide: boolean) => void;
}

const AuthPageContext = createContext<AuthPageContextValue | null>(null);

export function AuthPageProvider({ children }: { children: React.ReactNode }) {
  const [hideOAuth, setHideOAuth] = useState(false);

  const value = useMemo(
    () => ({ hideOAuth, setHideOAuth }),
    [hideOAuth]
  );

  return (
    <AuthPageContext.Provider value={value}>{children}</AuthPageContext.Provider>
  );
}

export function useAuthPage() {
  const ctx = useContext(AuthPageContext);
  if (!ctx) throw new Error("useAuthPage must be used within AuthPageProvider");
  return ctx;
}
