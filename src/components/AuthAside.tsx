"use client";

import { useEffect, useState } from "react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { LiveCounter } from "@/components/LiveCounter";
import { SourceTag } from "@/components/SourceTag";
import type { Problem } from "@/lib/types";

const LOGIN_FEATURES = [
  {
    title: "Personalized feed",
    desc: "Problems ranked to your stack, domains, and builder goal.",
  },
  {
    title: "AI build ideas",
    desc: "Three project suggestions tailored to your tech on every card.",
  },
  {
    title: "Live scrape pipeline",
    desc: "Fresh gaps from Reddit & HN every 30 minutes.",
  },
];

const SIGNUP_FEATURES = [
  {
    title: "60-second onboarding",
    desc: "Tell us your stack once — we handle the matching.",
  },
  {
    title: "Save & track builds",
    desc: "Bookmark problems and follow progress from idea to shipped.",
  },
  {
    title: "Free to start",
    desc: "Google, GitHub, or email — no credit card required.",
  },
];

function FeatureList({ items }: { items: typeof LOGIN_FEATURES }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-[11px] font-bold text-primary">
            ✓
          </span>
          <div>
            <p className="text-[14px] font-semibold text-foreground">{item.title}</p>
            <p className="text-[13px] leading-relaxed text-muted">{item.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SampleProblemCard() {
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    fetch("/api/problems")
      .then((r) => r.json())
      .then((d) => {
        const list: Problem[] = d.problems ?? [];
        if (list.length > 0) setProblem(list[0]);
      })
      .catch(() => {});
  }, []);

  if (!problem) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E8E8E4] bg-white p-5 text-center text-[12px] text-muted">
        Live problem cards appear here after your first scrape.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E8E8E4] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
          {problem.domain}
        </span>
        <SourceTag source={problem.source} />
      </div>
      <h3 className="mb-2 text-[15px] font-bold leading-snug tracking-tight text-foreground">
        {problem.headline}
      </h3>
      <p className="mb-4 line-clamp-2 text-[12px] leading-relaxed text-muted">
        {problem.description}
      </p>
      <div className="flex items-center justify-between">
        <DifficultyBadge difficulty={problem.difficulty} />
        <span className="text-[10px] text-[#BBBBBA]">{problem.time_estimate}</span>
      </div>
    </div>
  );
}

function StatPills() {
  return (
    <div className="flex flex-wrap gap-2">
      {["30 min scrape", "24h feed window", "6+ domains"].map((label) => (
        <span
          key={label}
          className="rounded-full border border-[#EBEBEB] bg-white px-3 py-1 text-[11px] font-medium text-[#666662]"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function AuthAside({ variant }: { variant: "login" | "signup" | "forgot" }) {
  if (variant === "forgot") {
    return (
      <div>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Account recovery
        </p>
        <h2 className="mb-4 text-[36px] font-extrabold leading-tight tracking-tight text-foreground">
          We&apos;ll get you back in.
        </h2>
        <p className="mb-8 max-w-[380px] text-[15px] leading-relaxed text-muted">
          Reset links expire after a short window for security. Check spam if you
          don&apos;t see the email within a minute.
        </p>
        <FeatureList
          items={[
            {
              title: "Secure reset flow",
              desc: "Powered by Supabase auth — your password never leaves the pipeline.",
            },
            {
              title: "Same account, same feed",
              desc: "Your saved problems and build tracker stay exactly as you left them.",
            },
          ]}
        />
      </div>
    );
  }

  if (variant === "signup") {
    return (
      <div>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Join Sealit
        </p>
        <h2 className="mb-4 text-[36px] font-extrabold leading-tight tracking-tight text-foreground">
          Stop scrolling.
          <br />
          Start building.
        </h2>
        <p className="mb-8 max-w-[400px] text-[15px] leading-relaxed text-muted">
          Builders use Sealit to find validated problems with real demand signals
          — not another generic idea list.
        </p>
        <div className="mb-8">
          <FeatureList items={SIGNUP_FEATURES} />
        </div>
        <SampleProblemCard />
        <p className="mt-6 text-[12px] text-[#BBBBBA]">
          <LiveCounter />
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        Welcome back
      </p>
      <h2 className="mb-4 text-[36px] font-extrabold leading-tight tracking-tight text-foreground">
        Your feed is
        <br />
        waiting.
      </h2>
      <p className="mb-8 max-w-[400px] text-[15px] leading-relaxed text-muted">
        Pick up where you left off — saved problems, build trackers, and fresh
        gaps scraped since you last signed in.
      </p>
      <div className="mb-8">
        <FeatureList items={LOGIN_FEATURES} />
      </div>
      <SampleProblemCard />
      <div className="mt-6 space-y-3">
        <StatPills />
        <p className="text-[12px] text-[#BBBBBA]">
          <LiveCounter />
        </p>
      </div>
    </div>
  );
}

export function AuthMobilePerks({ variant }: { variant: "login" | "signup" }) {
  const items = variant === "login" ? LOGIN_FEATURES : SIGNUP_FEATURES;

  return (
    <div className="mb-8 rounded-xl border border-[#EBEBEB] bg-white p-4 lg:hidden">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
        Why Sealit
      </p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.title} className="flex gap-2 text-[13px]">
            <span className="font-bold text-primary">·</span>
            <span>
              <span className="font-semibold text-foreground">{item.title}</span>
              {" — "}
              <span className="text-muted">{item.desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
