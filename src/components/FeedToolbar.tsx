"use client";

import { ScrapeTrigger } from "./LiveCounter";
import { SIDEBAR_CATEGORIES } from "@/lib/constants";
import { useSidebar } from "./SidebarContext";

export function FeedToolbar({
  search,
  onSearchChange,
  onScrape,
  viewMode,
  onViewModeChange,
  scraping = false,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onScrape: () => Promise<void>;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  scraping?: boolean;
}) {
  const { selectedCategory, setSelectedCategory } = useSidebar();

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 pb-3 pt-5 md:gap-4 md:px-6">
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problems, keywords, topics..."
            className="w-full rounded-lg border border-border bg-surface-subtle py-2.5 pl-10 pr-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary/30 focus:bg-surface"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-surface-subtle p-0.5">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`rounded-md p-1.5 transition-all duration-200 ease-in-out ${
                viewMode === "grid"
                  ? "bg-surface-muted text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              aria-label="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`rounded-md p-1.5 transition-all duration-200 ease-in-out ${
                viewMode === "list"
                  ? "bg-surface-muted text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              aria-label="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>

          <ScrapeTrigger onTrigger={onScrape} compact disabled={scraping} />
        </div>
      </div>

      {/* Category pills */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3 md:px-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all ${
            !selectedCategory
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-muted hover:border-primary/40 hover:text-foreground"
          }`}
        >
          All
        </button>
        {SIDEBAR_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all ${
              selectedCategory === cat.id
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-muted hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </header>
  );
}
