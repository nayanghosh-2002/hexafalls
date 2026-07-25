"use client";

import { createContext, useContext } from "react";

interface NavCountsCtx {
  refreshNavCounts: () => Promise<void>;
}

export const NavCountsContext = createContext<NavCountsCtx>({
  refreshNavCounts: async () => {},
});

export function useRefreshNavCounts() {
  return useContext(NavCountsContext).refreshNavCounts;
}
