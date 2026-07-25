"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedToolbar } from "@/components/FeedToolbar";
import { NewProblemToast } from "@/components/NewProblemToast";
import { ProblemCard } from "@/components/ProblemCard";
import { useSidebar } from "@/components/SidebarContext";
import {
  fetchBuildingProjects,
  fetchSavedProblems,
  fetchUserProfile,
  saveProblemRemote,
  unsaveProblemRemote,
  startBuildingRemote,
} from "@/lib/user-client";
import type { Problem } from "@/lib/types";

export default function FeedPage() {
  return <FeedContent />;
}

function FeedContent() {
  const router = useRouter();
  const { selectedCategory } = useSidebar();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [buildingIds, setBuildingIds] = useState<Set<string>>(new Set());
  const [newProblem, setNewProblem] = useState<Problem | null>(null);
  const [profile, setProfile] = useState<{ stack: string[]; domains: string[] } | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [setupMissing, setSetupMissing] = useState<string[]>([]);
  const knownIds = useRef<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const autoScrapeAttempted = useRef(false);

  const loadProblems = useCallback(async (isInitial = false): Promise<Problem[]> => {
    const res = await fetch("/api/problems");
    const data = await res.json();
    const fetched: Problem[] = data.problems ?? [];

    if (fetched.length === 0) {
      setEmptyMessage(
        "No problems yet. Run the scraper to pull live posts from Reddit and Hacker News."
      );
      return fetched;
    } else {
      setEmptyMessage(null);
    }

    if (isInitial || knownIds.current.size === 0) {
      // First load — set the full feed and record all IDs
      fetched.forEach((p) => knownIds.current.add(p.id));
      setProblems(fetched);
    } else {
      // Subsequent polls — only prepend genuinely new problems, keep existing order
      const newOnes = fetched.filter((p) => !knownIds.current.has(p.id));
      if (newOnes.length > 0) {
        newOnes.forEach((p) => knownIds.current.add(p.id));
        setNewProblem(newOnes[0]);
        setProblems((prev) => [...newOnes, ...prev]);
      }
    }

    return fetched;
  }, []);

  const runScrape = useCallback(async () => {
    setScraping(true);
    setEmptyMessage("Pulling live posts from Reddit & Hacker News…");

    try {
      const before = new Set(knownIds.current);
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();

      if (data.added?.length > 0) {
        setNewProblem(data.added[0] as Problem);
        setEmptyMessage(null);
        await loadProblems();
        return;
      }

      const currentProblems = await loadProblems();

      if (currentProblems.length > 0) {
        setEmptyMessage(null);
        const latest = currentProblems.find((p) => !before.has(p.id));
        if (latest) setNewProblem(latest);
        return;
      }

      if (data.errors?.length) {
        setEmptyMessage(data.errors[0]);
      } else if (data.added?.length === 0 && data.scraped > 0) {
        const parts: string[] = [];
        if (data.skipped > 0) {
          parts.push(`${data.skipped} posts already in the database`);
        }
        if (data.sources) {
          parts.push(
            `fetched ${data.sources.reddit ?? 0} Reddit + ${data.sources.hn ?? 0} HN posts`
          );
        }
        if (data.warnings?.length) {
          parts.push(data.warnings[0]);
        }
        setEmptyMessage(
          parts.length
            ? `Scrape ran (${parts.join(" · ")}). No new problems to add.`
            : "Posts were fetched but nothing new was added."
        );
      } else {
        setEmptyMessage("Scrape finished with no new problems.");
      }
    } catch {
      setEmptyMessage("Scrape request failed. Is the dev server running?");
    } finally {
      setScraping(false);
    }
  }, [loadProblems]);

  useEffect(() => {
    async function init() {
      const [onboarding, setupRes] = await Promise.all([
        fetchUserProfile(),
        fetch("/api/setup-status"),
      ]);

      if (onboarding) {
        setProfile({ stack: onboarding.stack, domains: onboarding.domains });
      }

      if (setupRes.ok) {
        const setup = await setupRes.json();
        setSetupMissing(setup.missing ?? []);
      }

      const [saved, building] = await Promise.all([
        fetchSavedProblems(),
        fetchBuildingProjects(),
      ]);
      setSavedIds(new Set(saved.map((s) => s.id)));
      setBuildingIds(new Set(building.map((b) => b.id)));

      const initialProblems = await loadProblems(true);

      if (!autoScrapeAttempted.current) {
        autoScrapeAttempted.current = true;
        if (initialProblems.length === 0) {
          await runScrape();
        }
      }
    }

    init();
    pollRef.current = setInterval(() => loadProblems(false), 15000);
    return () => clearInterval(pollRef.current);
  }, [loadProblems, runScrape]);

  async function handleSave(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (savedIds.has(id)) {
      await unsaveProblemRemote(id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await saveProblemRemote(id);
      setSavedIds((prev) => new Set([...Array.from(prev), id]));
    }
  }

  async function handleBuild(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!buildingIds.has(id)) {
      await startBuildingRemote(id);
      setBuildingIds((prev) => new Set([...Array.from(prev), id]));
    }
    router.push(`/building/${id}`);
  }

  async function handleScrape() {
    await runScrape();
  }

  let filtered = [...problems];

  if (selectedCategory) {
    filtered = filtered.filter((p) => p.domain === selectedCategory);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.headline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    if (!profile?.domains.length) return 0;
    const aMatch = profile.domains.includes(a.domain) ? 1 : 0;
    const bMatch = profile.domains.includes(b.domain) ? 1 : 0;
    return bMatch - aMatch;
  });


  return (
    <>
      {newProblem && (
        <NewProblemToast
          problem={newProblem}
          onDismiss={() => setNewProblem(null)}
        />
      )}

      <FeedToolbar
        search={search}
        onSearchChange={setSearch}
        onScrape={handleScrape}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        scraping={scraping}
      />

      <div className="px-6 py-4">

        {filtered.length === 0 ? (
          <div className="mx-auto max-w-lg py-20 text-center">
            <p className="mb-4 text-muted">
              {problems.length === 0
                ? emptyMessage ?? "Loading problems…"
                : "No problems match your filters."}
            </p>
            {problems.length === 0 && setupMissing.length > 0 ? (
              <div className="rounded-xl bg-surface-muted px-5 py-4 text-left text-sm text-muted">
                <p className="mb-2 font-semibold text-foreground">Add these to `.env.local`:</p>
                <ul className="list-inside list-disc space-y-1">
                  {setupMissing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs">
                  Run <code className="text-foreground">supabase/schema.sql</code> in your Supabase SQL
                  editor, then restart <code className="text-foreground">npm run dev</code>.
                </p>
              </div>
            ) : null}
            {problems.length === 0 ? (
              <button
                type="button"
                onClick={handleScrape}
                disabled={scraping}
                className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {scraping ? "Scraping…" : "Run scraper now"}
              </button>
            ) : null}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>article]:h-full">
            {filtered.map((p) => (
              <ProblemCard
                key={p.id}
                problem={p}
                saved={savedIds.has(p.id)}
                building={buildingIds.has(p.id)}
                onSave={(e) => handleSave(e, p.id)}
                onBuild={(e) => handleBuild(e, p.id)}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((p) => (
              <ProblemCard
                key={p.id}
                problem={p}
                saved={savedIds.has(p.id)}
                building={buildingIds.has(p.id)}
                onSave={(e) => handleSave(e, p.id)}
                onBuild={(e) => handleBuild(e, p.id)}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
