"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Problem } from "@/lib/types";
import { getDomainImage, getDomainGradient } from "@/lib/domain-images";
import { DifficultyBadge } from "./DifficultyBadge";
import { OpportunityScore } from "./OpportunityScore";
import { SourceTag } from "./SourceTag";

function CoverImage({ problem, className = "" }: { problem: Problem; className?: string }) {
  const [imgErr, setImgErr] = useState(false);
  const src = problem.cover_image || (!imgErr ? getDomainImage(problem.domain, problem.id) : null);

  if (src && !imgErr) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`object-cover ${className}`}
        loading="lazy"
        onError={() => setImgErr(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: getDomainGradient(problem.domain) }}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
        {problem.domain}
      </span>
    </div>
  );
}

function SaveButton({ saved, onClick }: { saved?: boolean; onClick?: (e: React.MouseEvent) => void }) {
  if (!onClick) return null;
  return (
    <button
      onClick={onClick}
      className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all ${
        saved
          ? "bg-primary"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={saved ? "white" : "none"}
        stroke={saved ? "white" : "#555550"}
        strokeWidth="2.2"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}

export function ProblemCard({
  problem,
  saved,
  building,
  onSave,
  onBuild,
  viewMode = "grid",
}: {
  problem: Problem;
  saved?: boolean;
  building?: boolean;
  onSave?: (e: React.MouseEvent) => void;
  onBuild?: (e: React.MouseEvent) => void;
  viewMode?: "grid" | "list";
}) {
  const router = useRouter();

  if (viewMode === "list") {
    return (
      <article className="group flex gap-5 rounded-xl border border-border bg-surface-muted p-4 transition-colors hover:border-muted">
        <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg">
          <CoverImage problem={problem} className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              {problem.domain}
            </span>
            <SourceTag source={problem.source} />
            {problem.opportunity_score != null && (
              <OpportunityScore score={problem.opportunity_score} />
            )}
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          <button
            type="button"
            onClick={() => router.push(`/problem/${problem.id}`)}
            className="w-full text-left"
          >
            <h3 className="mb-1.5 text-xl font-bold tracking-tight text-foreground group-hover:text-primary">
              {problem.headline}
            </h3>
            <p className="mb-3 line-clamp-2 text-base leading-relaxed text-muted">{problem.description}</p>
          </button>
          <div className="flex items-center justify-end gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                  saved
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:border-primary/40"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24"
                  fill={saved ? "white" : "none"}
                  stroke={saved ? "white" : "currentColor"}
                  strokeWidth="2.2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {saved ? "Saved" : "Save"}
              </button>
            )}
            {onBuild && (
              <button onClick={onBuild} className="text-sm font-semibold text-primary">
                {building ? "Building ✓" : "I'm building this"}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-muted transition-shadow hover:shadow-md dark:hover:shadow-black/20">
      <div className="relative h-[120px] shrink-0 overflow-hidden bg-surface-muted">
        <CoverImage problem={problem} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
        <SaveButton saved={saved} onClick={onSave} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-2.5 flex min-h-[52px] flex-wrap content-start items-start gap-1.5">
          <span className="rounded bg-primary-light px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            {problem.domain}
          </span>
          <SourceTag source={problem.source} />
          {problem.opportunity_score != null && (
            <OpportunityScore score={problem.opportunity_score} />
          )}
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <button
          type="button"
          onClick={() => router.push(`/problem/${problem.id}`)}
          className="mb-3 min-h-[104px] flex-1 text-left"
        >
          <h3 className="mb-1.5 line-clamp-2 text-[17px] font-bold leading-snug tracking-tight text-foreground group-hover:text-primary">
            {problem.headline}
          </h3>
          <p className="line-clamp-2 text-[15px] leading-relaxed text-muted">
            {problem.description}
          </p>
        </button>

        {onBuild && (
          <div className="mt-auto shrink-0">
            <button
              onClick={onBuild}
              className={`w-full rounded-lg py-2.5 text-[14px] font-semibold transition-colors ${
                building
                  ? "bg-primary text-white"
                  : "border border-border text-primary hover:bg-primary-light"
              }`}
            >
              {building ? "View build tracker →" : "I'm building this"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
