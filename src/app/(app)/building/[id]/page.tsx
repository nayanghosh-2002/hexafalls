"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BuildProgressChecklist } from "@/components/BuildProgressChecklist";
import { MentionCard } from "@/components/MentionCard";
import {
  fetchBuildingProjects,
  updateBuildingStageRemote,
} from "@/lib/user-client";
import type { BuildStage, BuildingActivity, Problem } from "@/lib/types";

const INITIAL_VISIBLE = 4;

export default function BuildingDashboardPage() {
  const params = useParams();
  const id = params.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [activity, setActivity] = useState<BuildingActivity | null>(null);
  const [startedAt, setStartedAt] = useState<string>("");
  const [stage, setStage] = useState<BuildStage>("idea");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [search]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    async function init() {
      const building = (await fetchBuildingProjects()).find((b) => b.id === id);

      if (!building) {
        setLoading(false);
        return;
      }

      const started = building.startedAt;
      setStartedAt(started);
      setStage(building.stage ?? "idea");

      async function load() {
        const res = await fetch(
          `/api/building-activity/${id}?startedAt=${encodeURIComponent(started)}`
        );
        const data = await res.json();
        setProblem(data.problem);
        setActivity(data.activity);
        setLoading(false);
      }

      await load();
      interval = setInterval(load, 30000);
    }

    init();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  async function handleStageChange(next: BuildStage) {
    await updateBuildingStageRemote(id, next);
    setStage(next);
  }

  if (loading || !problem || !activity) {
    return (
      <div className="py-20 text-center text-muted">Loading your build tracker…</div>
    );
  }

  const daysBuilding = Math.max(
    1,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const startLabel = new Date(startedAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const filteredPosts = activity.relatedPosts.filter((post) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
    );
  });

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = filteredPosts.length > visibleCount;

  return (
    <div className="px-6 py-8 md:px-8">
        <Link
          href="/building"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary transition-opacity hover:opacity-70"
        >
          ← All builds
        </Link>

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-primary">
          Building · Day {daysBuilding}
        </p>
        <h1 className="mb-8 font-serif text-[32px] font-bold leading-tight tracking-tight text-foreground lg:text-[36px]">
          {problem.headline}
        </h1>

        <div className="mb-10">
          <BuildProgressChecklist stage={stage} onStageChange={handleStageChange} />
        </div>

        <section>
          <div className="mb-2 flex items-start justify-between gap-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#888884]">
              Why this still matters
            </h2>
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3.5 py-1.5">
              <span className="text-[22px] font-extrabold leading-none tabular-nums text-primary">
                {filteredPosts.length}
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                  New mentions
                </span>
                <span className="text-[10px] font-medium text-primary/70">since you started</span>
              </div>
              {filteredPosts.length > 0 && (
                <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-red-500" />
              )}
            </div>
          </div>
          <p className="mb-5 text-[13px] text-[#888884]">
            Live Reddit &amp; Hacker News posts about this problem since you started on {startLabel}.
          </p>

          <div className="relative mb-5">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBBBBA]"
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mentions…"
              className="w-full rounded-lg border border-[#E8E8E8] bg-[#FAFAF8] py-2 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-[#BBBBBA] focus:border-primary/30 focus:bg-white"
            />
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-[#EBEBEB] bg-white px-5 py-10 text-center text-[13px] text-[#888884]">
              {search.trim()
                ? "No mentions match your search."
                : "No new mentions yet — we check every 30 seconds."}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {visiblePosts.map((post, i) => (
                  <MentionCard
                    key={`${post.url}-${i}`}
                    title={post.title}
                    excerpt={post.excerpt}
                    url={post.url}
                    source={post.source}
                    postedAt={post.postedAt}
                  />
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={() => setVisibleCount((c) => c + INITIAL_VISIBLE)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#EBEBEB] bg-white py-3 text-[13px] font-semibold text-[#666662] transition-colors hover:border-[#CCCCCA] hover:bg-[#FAFAF8]"
                >
                  Load more mentions
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </>
          )}
        </section>
      </div>
  );
}
