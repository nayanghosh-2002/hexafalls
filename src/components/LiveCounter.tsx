"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalBuilders: number;
  problemCount: number;
  lastUpdated: string | null;
  configured: boolean;
}

export function LiveCounter({ className = "" }: { className?: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch {
        setStats(null);
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats?.configured) {
    return (
      <span className={className}>
        Connect Supabase to see live builder stats
      </span>
    );
  }

  const updatedLabel = stats.lastUpdated
    ? `Last scrape ${new Date(stats.lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : "Waiting for first scrape";

  return (
    <span className={className}>
      {stats.totalBuilders.toLocaleString()} builders · {stats.problemCount} problems today · {updatedLabel}
    </span>
  );
}

export function ScrapeTrigger({
  onTrigger,
  compact = false,
  disabled = false,
}: {
  onTrigger?: () => Promise<void>;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const busy = loading || disabled;

  async function trigger() {
    setLoading(true);
    try {
      await onTrigger?.();
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <>
        <button
          onClick={trigger}
          disabled={busy}
          aria-label="Run scraper"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-muted text-sm transition-colors hover:bg-surface-subtle disabled:opacity-50 sm:hidden"
        >
          {busy ? "…" : "⚡"}
        </button>
        <button
          onClick={trigger}
          disabled={busy}
          className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-surface-subtle disabled:opacity-50 sm:flex"
        >
          <span className="text-[12px]">⚡</span>
          {busy ? "Scraping…" : "Scrape"}
        </button>
      </>
    );
  }

  return (
    <button
      onClick={trigger}
      disabled={loading}
      className="flex shrink-0 items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
    >
      <span>⚡</span>
      {loading ? "Scraping…" : "Run scraper"}
    </button>
  );
}
