"use client";

import Link from "next/link";
import type { Problem } from "@/lib/types";

export function NewProblemToast({
  problem,
  onDismiss,
}: {
  problem: Problem;
  onDismiss: () => void;
}) {
  return (
    <div className="animate-slide-down fixed left-0 right-0 top-0 z-[200] px-4 pt-4">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-primary/20 bg-white px-4 py-3 shadow-lg">
        <div className="flex h-2 w-2 shrink-0 rounded-full bg-green-500 animate-pulse-dot" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            New problem just found
          </p>
          <p className="truncate text-sm font-medium text-foreground">
            {problem.headline}
          </p>
        </div>
        <Link
          href={`/problem/${problem.id}`}
          onClick={onDismiss}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
        >
          View
        </Link>
        <button
          onClick={onDismiss}
          className="shrink-0 text-[#BBBBBA] hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
