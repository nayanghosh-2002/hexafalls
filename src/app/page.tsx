"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BoMascot } from "@/components/BoMascot";
import { useLandingAuthTransition } from "@/components/LandingAuthTransition";
import { TransitionLink } from "@/components/TransitionLink";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { NavBar } from "@/components/Nav";
import { SourceTag } from "@/components/SourceTag";
import type { Problem } from "@/lib/types";

function LandingHeroBo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(520);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const node = el;
    function measure() {
      const { width, height } = node.getBoundingClientRect();
      setSize(Math.round(Math.min(width, height) * 1.08));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 50% 55%, rgba(46,144,237,0.14) 0%, transparent 72%)",
        }}
        aria-hidden
      />
      <div data-bo-hero className="translate-x-10 -translate-y-8">
        <BoMascot size={size} intensity="normal" interactive priority />
      </div>
    </div>
  );
}


function PreviewCard({ problem }: { problem: Problem }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
          {problem.domain}
        </span>
        <SourceTag source={problem.source} />
      </div>
      <h3 className="mb-2.5 flex-1 text-[17px] font-bold leading-snug tracking-tight text-foreground">
        {problem.headline}
      </h3>
      <p className="mb-5 line-clamp-2 text-[13px] leading-relaxed text-muted">
        {problem.description}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <DifficultyBadge difficulty={problem.difficulty} />
        <span className="text-[11px] text-[#BBBBBA]">{problem.time_estimate}</span>
      </div>
    </div>
  );
}

const STATS = [
  { value: "Daily", label: "Scrape schedule" },
  { value: "24h", label: "Fresh problem window" },
  { value: "3", label: "AI build ideas per card" },
  { value: "6+", label: "Problem domains" },
];

const FEATURES = [
  {
    title: "Personalized feed",
    desc: "Onboarding captures your stack, domains, and builder goal — then ranks problems you can actually ship.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Gemini build ideas",
    desc: "Every problem card gets three stack-specific project ideas — not generic \"build an app\" suggestions.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Building tracker",
    desc: "Mark a problem as \"I'm building this\" and track progress from idea → MVP → shipped with a live mention feed.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    title: "Save & revisit",
    desc: "Bookmark problems for later. Your saved list stays in sync so you never lose a weekend project idea.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const PERSONAS = [
  {
    title: "Hackathon builders",
    desc: "Skip the ideation phase. Show up with a validated problem, a raw Reddit thread, and three build paths already mapped to your stack.",
  },
  {
    title: "Side project devs",
    desc: "Stop scrolling r/SomebodyMakeThis for hours. Get a curated feed of problems matched to React, Python, or whatever you actually use.",
  },
  {
    title: "Early-stage founders",
    desc: "Find gaps people are already complaining about — with context on what's been tried and why it failed.",
  },
];

const FAQ = [
  {
    q: "Where do problems come from?",
    a: "We scrape r/SomebodyMakeThis, r/startups, and Ask HN daily. Raw posts are structured by Gemini into problem cards with headline, domain, difficulty, and context.",
  },
  {
    q: "How is this different from browsing Reddit?",
    a: "Reddit is unstructured noise. Sealit deduplicates, structures, scores, and ranks problems against your stack — so you see buildable opportunities, not endless threads.",
  },
  {
    q: "Do I need Supabase or Gemini to try it?",
    a: "No. Sign up, browse the feed, save problems, and use the building tracker — everything works out of the box. Supabase and Gemini power the pipeline on our end; you don't need to configure them yourself.",
  },
  {
    q: "Can I track something I'm already building?",
    a: "Yes — including personal projects that didn't start from the feed. Add what you're working on and our motivator helps you name the problem you're solving, then keeps you going with progress checklists and a mention feed.",
  },
];

export default function LandingPage() {
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    fetch("/api/problems")
      .then((r) => r.json())
      .then((d) => setProblems(d.problems ?? []))
      .catch(() => setProblems([]));
  }, []);

  const previews = problems.slice(0, 3);
  const { isSliding, slideX } = useLandingAuthTransition();

  return (
    <motion.div
      id="landing-page-root"
      className={`min-h-screen bg-background ${
        isSliding ? "fixed inset-0 z-[501] w-screen overflow-y-auto" : ""
      }`}
      style={isSliding ? { x: slideX } : undefined}
    >
      <NavBar
        right={
          <div className="flex items-center gap-2">
            <TransitionLink
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Log in
            </TransitionLink>
            <TransitionLink
              href="/signup"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-88"
            >
              Sign up
            </TransitionLink>
          </div>
        }
      />

      {/* Hero */}
      <section className="flex min-h-[calc(100vh-58px)] items-center">
        <div className="mx-auto w-full max-w-[1200px] px-14">
          <div className="flex items-center gap-16">
            <div className="min-w-0 flex-1">
              <div className="mb-7 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Real Problems · Real Builders · Fresh Daily
              </div>
              <h1 className="mb-8 text-[76px] font-extrabold leading-[0.93] tracking-tight text-foreground">
                Build things
                <br />
                that need
                <br />
                to exist.
              </h1>
              <p className="mb-11 max-w-[420px] text-lg leading-relaxed text-[#666662]">
                A personalized feed of real unsolved problems — scraped from Reddit
                and HN, structured by Gemini, matched to your stack.
              </p>
              <div className="flex items-center gap-3.5">
                <TransitionLink
                  href="/signup"
                  className="rounded-[10px] bg-primary px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-88"
                >
                  Get started
                </TransitionLink>
              </div>
            </div>

            <div className="relative h-[580px] w-[540px] shrink-0 overflow-visible">
              <LandingHeroBo />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="flex min-h-[calc(100vh-58px)] items-center bg-surface">
        <div className="mx-auto w-full max-w-[1200px] px-14 py-12">
          <div className="mb-10 text-[11px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
            How Sealit works
          </div>
          <div className="grid grid-cols-3 gap-12 lg:gap-16">
            {[
              {
                n: "01",
                title: "We scrape real gaps.",
                desc: "Every day, we pull fresh posts from r/SomebodyMakeThis, r/startups, and Ask HN — then Gemini structures them into problem cards.",
              },
              {
                n: "02",
                title: "We match them to you.",
                desc: "Your stack, domain interests, and builder goal shape a feed of problems you could realistically build a solution for.",
              },
              {
                n: "03",
                title: "We suggest what to build.",
                desc: "Open any problem and Gemini generates 3 specific project ideas tailored to your stack — ready for this weekend.",
              },
            ].map((s) => (
              <div key={s.n}>
                <div className="mb-3 text-[13px] font-bold text-primary">{s.n}</div>
                <h3 className="mb-3 text-2xl font-bold tracking-tight text-foreground">{s.title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-14">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-14 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="mb-1 text-[36px] font-extrabold tracking-tight text-white">{s.value}</div>
              <div className="text-[13px] font-medium text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-[1200px] px-14">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-primary">
            Product
          </div>
          <h2 className="mb-4 max-w-[520px] text-[44px] font-extrabold leading-tight tracking-tight text-foreground">
            Everything you need to go from scroll to shipped.
          </h2>
          <p className="mb-14 max-w-[560px] text-[16px] leading-relaxed text-muted">
            Sealit isn&apos;t another idea generator. It&apos;s a full workflow — discover,
            evaluate, save, build, and track momentum on problems that already have
            real demand signals.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-surface p-7"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                  {f.icon}
                </div>
                <h3 className="mb-2.5 text-xl font-bold tracking-tight text-foreground">{f.title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem previews */}
      <section className="bg-surface py-24">
        <div className="mx-auto max-w-[1200px] px-14">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
                Live from the feed
              </div>
              <h2 className="text-[40px] font-extrabold leading-tight tracking-tight text-foreground">
                Problems people are asking for right now.
              </h2>
            </div>
            <TransitionLink
              href="/login"
              className="shrink-0 text-[14px] font-semibold text-primary transition-opacity hover:opacity-70"
            >
              See full feed →
            </TransitionLink>
          </div>
          <p className="mb-10 max-w-[640px] text-[15px] leading-relaxed text-muted">
            Each card links back to the original Reddit or Hacker News thread. Gemini
            extracts the core gap, tags the domain, and estimates difficulty — so you
            can decide in seconds whether it&apos;s worth your weekend.
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {previews.length === 0 ? (
              <p className="col-span-full text-center text-muted">
                No live problems yet — sign up and run the scraper to fill your feed.
              </p>
            ) : (
              previews.map((p) => <PreviewCard key={p.id} problem={p} />)
            )}
          </div>
        </div>
      </section>

      {/* Pipeline detail */}
      <section className="py-24">
        <div className="mx-auto max-w-[1200px] px-14">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-primary">
                Under the hood
              </div>
              <h2 className="mb-6 text-[40px] font-extrabold leading-tight tracking-tight text-foreground">
                From raw post to build-ready card in one pipeline.
              </h2>
              <div className="space-y-5">
                {[
                  {
                    step: "Scrape",
                    detail: "Cheerio + Axios pull titles and bodies from Reddit JSON and HN Algolia API.",
                  },
                  {
                    step: "Structure",
                    detail: "Gemini extracts headline, domain, difficulty, context, and what's been tried before.",
                  },
                  {
                    step: "Store",
                    detail: "Problems land in Supabase with dedup by source URL.",
                  },
                  {
                    step: "Serve",
                    detail: "Your feed polls every 15 seconds. New problems trigger a toast — no manual refresh.",
                  },
                ].map((item, i) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
                      {i + 1}
                    </div>
                    <div>
                      <div className="mb-1 text-[14px] font-bold text-foreground">{item.step}</div>
                      <p className="m-0 text-[14px] leading-relaxed text-muted">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-8">
              <p className="mb-6 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Sources we monitor
              </p>
              <div className="space-y-4">
                {[
                  { name: "r/SomebodyMakeThis", desc: "Direct product requests from people who want something built." },
                  { name: "r/startups", desc: "Founder pain points, market gaps, and unmet workflow needs." },
                  { name: "Ask HN", desc: "Technical builders describing tools that should exist but don't." },
                ].map((src) => (
                  <div
                    key={src.name}
                    className="rounded-xl border border-border bg-surface-muted px-5 py-4"
                  >
                    <div className="mb-1 text-[15px] font-bold text-foreground">{src.name}</div>
                    <p className="m-0 text-[13px] leading-relaxed text-muted">{src.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Health", "Dev Tools", "FinTech", "AgriTech", "EdTech", "Climate"].map((d) => (
                  <span
                    key={d}
                    className="rounded-md border border-primary/25 bg-primary-light px-2.5 py-1 text-[11px] font-semibold text-primary"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="bg-surface py-24">
        <div className="mx-auto max-w-[1200px] px-14">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
            Built for
          </div>
          <h2 className="mb-14 text-[40px] font-extrabold leading-tight tracking-tight text-foreground">
            Who opens Sealit every morning.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {PERSONAS.map((p) => (
              <div key={p.title} className="pl-6">
                <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground">{p.title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="mx-auto max-w-[720px] px-14">
          <div className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-primary">
            FAQ
          </div>
          <h2 className="mb-12 text-center text-[40px] font-extrabold leading-tight tracking-tight text-foreground">
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-surface px-6 py-1 open:pb-5"
              >
                <summary className="cursor-pointer list-none py-4 text-[15px] font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="shrink-0 text-[#BBBBBA] transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="m-0 pb-1 text-[14px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-surface py-[100px] text-center">
        <div className="mx-auto max-w-[1200px] px-14">
          <h2 className="mb-5 text-[60px] font-extrabold leading-none tracking-tight text-foreground">
            Start building what
            <br />
            needs to exist.
          </h2>
          <p className="mb-4 text-lg text-[#999995]">
            Join builders who open Sealit instead of Hacker News every morning.
          </p>
          <p className="mb-12 text-[14px] text-[#BBBBBA]">
            Free to start · Google & GitHub sign-in · 60-second onboarding
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <TransitionLink
              href="/signup"
              className="inline-block rounded-[10px] bg-primary px-9 py-4 text-[17px] font-semibold text-white transition-opacity hover:opacity-88"
            >
              Sign up
            </TransitionLink>
            <TransitionLink
              href="/login"
              className="inline-block rounded-[10px] border border-[#E0E0DC] bg-surface px-9 py-4 text-[17px] font-semibold text-foreground transition-colors hover:border-[#C0C0BC]"
            >
              Log in
            </TransitionLink>
          </div>
        </div>
      </section>

      <footer className="py-10">
        <div className="mx-auto max-w-[1200px] px-14">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-8">
            <div>
              <span className="logo text-[15px] font-bold tracking-tight">Sealit</span>
              <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#BBBBBA]">
                Problems worth building. Scraped daily, matched to your stack.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA]">Product</p>
                <div className="flex flex-col gap-2 text-[13px] text-[#666662]">
                  <TransitionLink href="/login" className="transition-colors hover:text-foreground">Feed</TransitionLink>
                  <TransitionLink href="/login" className="transition-colors hover:text-foreground">Building tracker</TransitionLink>
                  <TransitionLink href="/login" className="transition-colors hover:text-foreground">Saved problems</TransitionLink>
                </div>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA]">Account</p>
                <div className="flex flex-col gap-2 text-[13px] text-[#666662]">
                  <TransitionLink href="/signup" className="transition-colors hover:text-foreground">Sign up</TransitionLink>
                  <TransitionLink href="/login" className="transition-colors hover:text-foreground">Log in</TransitionLink>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <span className="text-xs text-[#CCCCCA]">© 2026 Sealit</span>
            <span className="text-xs text-[#CCCCCA]">Reddit · Hacker News · Gemini · Supabase</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
