"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { fetchSavedProblems } from "@/lib/user-client";
import type { Problem } from "@/lib/types";

function formatSavedDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SavedPage() {
  const [saved, setSaved] = useState<{ problem: Problem; savedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // 1. Fetch saved problem IDs from backend
        const savedList = await fetchSavedProblems();

        if (!savedList || savedList.length === 0) {
          setSaved([]);
          setLoading(false);
          return;
        }

        // 2. Fetch full problem details safely
        const results = await Promise.all(
          savedList.map(async (s) => {
            try {
              const res = await fetch(`/api/problems/${s.id}`);
              if (!res.ok) return null;
              const data = await res.json();
              if (!data.problem) return null;
              return { problem: data.problem as Problem, savedAt: s.savedAt };
            } catch (err) {
              console.error(`Failed to load problem ${s.id}:`, err);
              return null;
            }
          })
        );

        // 3. Filter out nulls/failed requests
        const validItems = results.filter(
          (r): r is { problem: Problem; savedAt: string } => r !== null
        );

        setSaved(validItems);
      } catch (err) {
        console.error("Error loading saved problems:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="px-6 py-10 md:px-8">
      <div className="mb-9 pb-2">
        <h1 className="mb-1 text-[28px] font-bold tracking-tight text-foreground">
          Saved
        </h1>
        <p className="text-[13px] text-[#AAAAAA]">
          {loading
            ? "Loading…"
            : saved.length === 0
            ? "No problems bookmarked"
            : `${saved.length} problem${saved.length === 1 ? "" : "s"} bookmarked`}
        </p>
      </div>

      {!loading && saved.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[14px] border border-[#EBEBEB]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#CCCCCA"
              strokeWidth="1.5"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="mb-2 text-lg font-semibold tracking-tight text-foreground">
            Nothing saved yet
          </p>
          <p className="mx-auto mb-6 max-w-[280px] text-sm leading-relaxed text-[#AAAAAA]">
            Click Save on any problem in your feed to bookmark it here.
          </p>
          <Link
            href="/feed"
            className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Browse feed →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map(({ problem, savedAt }) => (
            <Link
              key={problem.id}
              href={`/problem/${problem.id}`}
              className="block rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-primary-light px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {problem.domain}
                </span>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug tracking-tight text-foreground">
                {problem.headline}
              </h3>
              <p className="mb-4 line-clamp-2 text-[13px] text-muted">
                {problem.description}
              </p>
              <div className="mt-auto border-t border-border pt-3 text-[11px] font-medium text-[#BBBBBA]">
                Saved {formatSavedDate(savedAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}