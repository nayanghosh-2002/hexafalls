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
      const savedList = await fetchSavedProblems();

      const results = await Promise.all(
        savedList.map(async (s) => {
          const res = await fetch(`/api/problems/${s.id}`);
          if (!res.ok) return null;
          const data = await res.json();
          return { problem: data.problem as Problem, savedAt: s.savedAt };
        })
      );

      setSaved(results.filter((r): r is { problem: Problem; savedAt: string } => r !== null));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="px-6 py-10 md:px-8">
        <div className="mb-9 pb-2">
          <h1 className="mb-1 text-[28px] font-bold tracking-tight text-foreground">Saved</h1>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CCCCCA" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="mb-2 text-lg font-semibold tracking-tight text-foreground">Nothing saved yet</p>
            <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-[#AAAAAA]">
              Click Save on any problem in your feed to bookmark it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {saved.map(({ problem, savedAt }) => (
              <Link
                key={problem.id}
                href={`/problem/${problem.id}`}
                className="block rounded-[10px] border border-border bg-white p-5 transition-colors hover:border-[#CCCCCA]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    {problem.domain}
                  </span>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </div>
                <p className="mb-4 line-clamp-3 text-sm font-semibold leading-snug tracking-tight text-foreground">
                  {problem.headline}
                </p>
                <div className="mt-2 text-[10px] text-[#BBBBBA]">
                  Saved {formatSavedDate(savedAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
