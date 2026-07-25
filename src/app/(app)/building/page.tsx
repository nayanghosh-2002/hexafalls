"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchBuildingProjects } from "@/lib/user-client";
import type { Problem } from "@/lib/types";

export default function BuildingListPage() {
  const [items, setItems] = useState<{ problem: Problem; startedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const building = await fetchBuildingProjects();

      const results = await Promise.all(
        building.map(async (b) => {
          const res = await fetch(`/api/problems/${b.id}`);
          if (!res.ok) return null;
          const data = await res.json();
          return { problem: data.problem as Problem, startedAt: b.startedAt };
        })
      );

      setItems(results.filter((r): r is { problem: Problem; startedAt: string } => r !== null));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="px-6 py-10 md:px-8">
        <div className="mb-9 pb-2">
          <h1 className="mb-1 text-[28px] font-bold tracking-tight text-foreground">
            Building
          </h1>
          <p className="text-[13px] text-[#AAAAAA]">
            Problems you&apos;re actively solving
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[14px] border border-[#EBEBEB]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CCCCCA" strokeWidth="1.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <p className="mb-2 text-lg font-semibold text-foreground">Nothing in progress yet</p>
            <p className="mx-auto mb-6 max-w-[300px] text-sm text-[#AAAAAA]">
              Hit &ldquo;I&apos;m building this&rdquo; on any problem in your feed to start tracking momentum.
            </p>
            <Link
              href="/feed"
              className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Browse problems →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(({ problem, startedAt }) => {
              const days = Math.floor(
                (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              const label = days === 0 ? "Started today" : `Day ${days + 1} building`;

              return (
                <Link
                  key={problem.id}
                  href={`/building/${problem.id}`}
                  className="block rounded-xl border border-border bg-white p-5 transition-colors hover:border-primary/30"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                      {problem.domain}
                    </span>
                    <span className="text-[11px] font-medium text-muted">{label}</span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {problem.headline}
                  </h3>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}
