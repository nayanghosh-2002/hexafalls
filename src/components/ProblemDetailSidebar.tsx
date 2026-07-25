"use client";

import Link from "next/link";
import { useState } from "react";
import type { Problem } from "@/lib/types";
import { OpportunityScore } from "./OpportunityScore";

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 text-[13px] text-[#888884]">
        <span className="text-[#BBBBBA]">{icon}</span>
        {label}
      </div>
      <div className="text-[13px] font-medium text-foreground">{value}</div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const icons = {
  source: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  tag: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  gauge: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  users: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

export function ProblemDetailSidebar({
  problem,
  related,
}: {
  problem: Problem;
  related: Problem[];
}) {
  const [copied, setCopied] = useState(false);
  const sourceLabel = problem.source === "reddit" ? "Reddit" : "Hacker News";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <aside className="w-[280px] shrink-0 space-y-4">
      <SidebarCard title="Overview">
        <MetaRow
          icon={icons.source}
          label="Source"
          value={
            <span className="rounded bg-[#FFF0EB] px-2 py-0.5 text-[11px] font-bold uppercase text-[#FF4500]">
              {sourceLabel}
            </span>
          }
        />
        <MetaRow icon={icons.clock} label="First seen" value={formatDate(problem.created_at)} />
        <MetaRow icon={icons.refresh} label="Refreshed" value="30 min ago" />
        <MetaRow
          icon={icons.tag}
          label="Category"
          value={
            <span className="rounded bg-primary-light px-2 py-0.5 text-[11px] font-bold uppercase text-primary">
              {problem.domain}
            </span>
          }
        />
        <MetaRow
          icon={icons.gauge}
          label="Difficulty"
          value={
            <span className="rounded bg-[#FFF8ED] px-2 py-0.5 text-[11px] font-bold uppercase text-[#7A5010]">
              {problem.difficulty}
            </span>
          }
        />
        <MetaRow icon={icons.users} label="Builders" value={problem.builders_count.toLocaleString()} />
        <MetaRow icon={icons.calendar} label="Est. build time" value={problem.time_estimate ?? "2-4 weeks"} />
      </SidebarCard>

      <SidebarCard title="Why this matters">
        <p className="mb-4 text-[13px] leading-relaxed text-[#666662]">
          {problem.description}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0EB] px-3 py-1 text-[11px] font-semibold text-[#FF4500]">
          🔥 High real-world impact
        </span>
      </SidebarCard>

      {related.length > 0 && (
        <SidebarCard title="Related problems">
          <div className="space-y-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/problem/${r.id}`}
                className="group flex items-start justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-[#F7F7F5]"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="line-clamp-2 text-[13px] leading-snug text-[#555550] group-hover:text-foreground">
                    {r.headline}
                  </span>
                </div>
                {r.opportunity_score && (
                  <OpportunityScore score={r.opportunity_score} />
                )}
              </Link>
            ))}
          </div>
        </SidebarCard>
      )}

      <SidebarCard title="Share this problem">
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            title="Copy link"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EBEBEB] bg-[#FAFAF8] text-sm transition-colors hover:border-[#CCCCCA] hover:bg-white"
          >
            {copied ? "✓" : "🔗"}
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(problem.headline)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            title="Twitter"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EBEBEB] bg-[#FAFAF8] text-sm font-bold transition-colors hover:border-[#CCCCCA] hover:bg-white"
          >
            𝕏
          </a>
          <a
            href={`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            title="LinkedIn"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EBEBEB] bg-[#FAFAF8] text-xs font-bold transition-colors hover:border-[#CCCCCA] hover:bg-white"
          >
            in
          </a>
        </div>
      </SidebarCard>
    </aside>
  );
}
