"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "sealit_sidebar_open";

function readStoredOpen(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== null ? stored === "true" : true;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setOpen(readStoredOpen());
  }, []);

  const persist = useCallback((value: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, []);

  const toggle = useCallback(() => {
    setOpen((current) => {
      const next = !current;
      persist(next);
      return next;
    });
  }, [persist]);

  const close = useCallback(() => {
    setOpen(false);
    persist(false);
  }, [persist]);

  const value = useMemo(
    () => ({ open, toggle, close, selectedCategory, setSelectedCategory }),
    [open, toggle, close, selectedCategory]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarToggle({ className = "" }: { className?: string }) {
  const { toggle, open } = useSidebar();

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
      className={`relative z-30 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground ${className}`}
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={open}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
