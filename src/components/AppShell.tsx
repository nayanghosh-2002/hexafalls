"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "./Nav";
import { SidebarProvider, SidebarToggle, useSidebar } from "./SidebarContext";
import { ThemeToggle } from "./ThemeToggle";
import { fetchUserProjects } from "@/lib/user-client";
import { useNavCounts } from "@/lib/use-nav-counts";
import { NavCountsContext } from "@/lib/nav-counts-context";
import type { UserProject } from "@/lib/types";

const feedIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const buildIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const saveIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const profileIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const projectIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const COLLAPSED_WIDTH = 56;
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 220;
const WIDTH_KEY = "sealit_sidebar_width";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { savedCount, buildingCount, refresh: refreshNavCounts } = useNavCounts();
  const pathname = usePathname();
  const { open, close } = useSidebar();

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const widthRef = useRef(DEFAULT_WIDTH);

  const [userProjects, setUserProjects] = useState<UserProject[]>([]);

  // Load persisted width
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WIDTH_KEY);
      if (stored) {
        const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parseInt(stored, 10)));
        setSidebarWidth(w);
        widthRef.current = w;
      }
    } catch {}
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const projects = await fetchUserProjects();
      setUserProjects(projects);
    } catch {
      setUserProjects([]);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Drag-to-resize
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      if (!open) return;
      e.preventDefault();
      setResizing(true);
      const startX = e.clientX;
      const startWidth = widthRef.current;

      function onMove(ev: MouseEvent) {
        const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + ev.clientX - startX));
        setSidebarWidth(w);
        widthRef.current = w;
      }

      function onUp() {
        setResizing(false);
        try { localStorage.setItem(WIDTH_KEY, String(widthRef.current)); } catch {}
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [open]
  );

  const navItem = (
    href: string,
    label: string,
    icon: React.ReactNode,
    active: boolean,
    badge?: number
  ) => (
    <Link
      href={href}
      title={!open ? label : undefined}
      aria-label={label}
      onClick={() => { if (window.innerWidth < 768 && open) close(); }}
      className={`relative flex min-h-[42px] items-center rounded-lg transition-colors duration-200 ${
        open ? "gap-3 px-3 py-2.5 text-sm" : "justify-center p-2.5"
      } ${
        active
          ? "bg-surface-muted font-semibold text-foreground"
          : "font-medium text-muted hover:bg-background hover:text-foreground"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {open && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {open && badge && badge > 0 ? (
        <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      {!open && badge && badge > 0 ? (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
      ) : null}
    </Link>
  );

  const feedActive =
    pathname === "/feed" ||
    (pathname.startsWith("/problem") && !pathname.startsWith("/building"));

  const showSidebarThemeToggle = pathname !== "/profile";

  const currentWidth = open ? sidebarWidth : COLLAPSED_WIDTH;

  return (
    <NavCountsContext.Provider value={{ refreshNavCounts }}>
    {/* Apply col-resize cursor to the whole page during drag so it doesn't flicker */}
    <div
      className="flex h-screen overflow-hidden animate-fade-in bg-surface"
      style={resizing ? { cursor: "col-resize", userSelect: "none" } : undefined}
    >
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={close}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`relative flex shrink-0 flex-col overflow-hidden border-r border-border bg-surface ${
          !resizing ? "transition-[width] duration-300 ease-in-out" : ""
        } ${
          open
            ? "fixed inset-y-0 left-0 z-50 md:relative md:z-auto"
            : "relative z-auto"
        }`}
        style={{ width: currentWidth }}
      >
        {/* Header: Logo left, hamburger right */}
        <div className={`flex min-h-[57px] shrink-0 items-center py-3.5 ${open ? "px-3" : "justify-center px-2"}`}>
          {open && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <Logo className="text-[17px]" />
            </div>
          )}
          <SidebarToggle />
        </div>

        {/* Nav items */}
        <nav className={`flex flex-col gap-0.5 ${open ? "p-3" : "px-2 py-3"}`}>
          {navItem("/feed", "Feed", feedIcon, feedActive)}
          {navItem("/building", "Building", buildIcon, pathname.startsWith("/building"), buildingCount || undefined)}
          {navItem("/saved", "Saved", saveIcon, pathname === "/saved", savedCount || undefined)}
          {navItem("/profile", "Profile", profileIcon, pathname === "/profile")}
        </nav>

        {/* Divider */}
        <div className={`shrink-0 border-t border-border ${open ? "mx-3" : "mx-2"}`} />

        {/* Projects section */}
        <div className={`mt-2 flex-1 overflow-y-auto overflow-x-hidden pb-3 ${open ? "px-3" : "px-2"}`}>
          {userProjects.length > 0 && (
            <div className="mt-2">
              {open && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
                  Projects
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {userProjects.slice(0, 10).map((project) => {
                  const href = `/project/${project.github_username}/${project.repo_name}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={project.id}
                      href={href}
                      title={!open ? project.repo_name : undefined}
                      aria-label={project.repo_name}
                      onClick={() => { if (window.innerWidth < 768 && open) close(); }}
                      className={`flex min-h-[38px] items-center rounded-lg transition-colors duration-200 ${
                        open ? "gap-3 px-3 py-2 text-[13px]" : "justify-center p-2.5"
                      } ${
                        active
                          ? "bg-primary-light font-semibold text-primary"
                          : "font-medium text-muted hover:bg-surface-muted hover:text-foreground"
                      }`}
                    >
                      <span className="shrink-0 text-muted">{projectIcon}</span>
                      {open && <span className="min-w-0 flex-1 truncate">{project.repo_name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {showSidebarThemeToggle && (
          <div className={`mt-auto ${open ? "flex items-center justify-between px-3 py-3" : "flex justify-center py-3"}`}>
            <ThemeToggle />
          </div>
        )}

        {/* Drag handle — right edge of sidebar */}
        {open && (
          <div
            onMouseDown={startResize}
            className="absolute inset-y-0 right-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors"
            aria-hidden
          />
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        <main className="flex-1 overflow-y-auto bg-surface">{children}</main>
      </div>
    </div>
    </NavCountsContext.Provider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}

export { SidebarToggle };
