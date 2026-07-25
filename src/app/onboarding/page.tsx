"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/Nav";
import { STACK_OPTIONS, DOMAIN_OPTIONS, GOAL_OPTIONS } from "@/lib/constants";
import { saveUserProfile, analyzeLinks, syncGitHubProjects } from "@/lib/user-client";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { BoMascot } from "@/components/BoMascot";
import type { BuilderGoal } from "@/lib/types";

type Mode = "auto" | "links" | "manual-stack" | "manual-domains" | "manual-goal" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("auto");

  // Link analysis state
  const [links, setLinks] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [, setDetected] = useState<{ stack: string[]; domains: string[] } | null>(null);

  // Manual flow state
  const [stack, setStack] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [goal, setGoal] = useState<BuilderGoal | "">("");
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const manualStep = mode === "manual-stack" ? 1 : mode === "manual-domains" ? 2 : 3;
  const manualPct = Math.round((manualStep / 3) * 100);

  // On mount: check if the user signed in with GitHub OAuth.
  // If so, auto-extract their GitHub username and run profile setup immediately.
  useEffect(() => {
    async function tryAutoSetup() {
      const supabase = getSupabaseBrowser();
      if (!supabase) { setMode("links"); return; }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) { setMode("links"); return; }

      const provider = user.app_metadata?.provider;
      const githubUsername =
        user.user_metadata?.user_name ??
        user.user_metadata?.preferred_username ??
        null;

      if (provider === "github" && githubUsername) {
        setGithubUsername(githubUsername);
        try {
          const result = await analyzeLinks([`https://github.com/${githubUsername}`]);
          const finalStack = result?.stack ?? [];
          const finalDomains = result?.domains ?? [];

          if (finalStack.length > 0 || finalDomains.length > 0) {
            const saved = await saveUserProfile({
              stack: finalStack,
              domains: finalDomains,
              goal: "side_project",
              completed: true,
              github_username: githubUsername,
              display_name: result?.display_name ?? user.user_metadata?.full_name ?? undefined,
              bio: result?.bio ?? undefined,
              location: result?.location ?? undefined,
              avatar_url: result?.avatar_url ?? user.user_metadata?.avatar_url ?? undefined,
              website: result?.website ?? undefined,
              linkedin_url: result?.linkedin_url ?? undefined,
              portfolio_url: result?.portfolio_url ?? undefined,
              links: result?.links ?? [`https://github.com/${githubUsername}`],
              certifications: result?.certifications ?? undefined,
              experience: result?.experience ?? undefined,
              education: result?.education ?? undefined,
            });
            if (saved) {
              syncGitHubProjects(githubUsername).catch(() => {});
              router.push("/feed");
              return;
            }
          }

          setLinks(`https://github.com/${githubUsername}`);
          setMode("links");
        } catch {
          setLinks(`https://github.com/${githubUsername}`);
          setMode("links");
        }
      } else {
        setMode("links");
      }
    }
    tryAutoSetup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleStack(item: string) {
    setStack((prev) => prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]);
  }

  function toggleDomain(item: string) {
    setDomains((prev) => prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]);
  }

  async function handleAnalyze() {
    const rawLinks = links.split("\n").map((l) => l.trim()).filter(Boolean);
    if (rawLinks.length === 0) {
      setAnalyzeError("Paste at least one link");
      return;
    }
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      const result = await analyzeLinks(rawLinks);
      const hasUsefulData = result && (
        result.stack.length > 0 ||
        result.domains.length > 0 ||
        result.github_username ||
        result.display_name ||
        result.avatar_url
      );
      if (hasUsefulData && result) {
        if (result.github_username) setGithubUsername(result.github_username);
        const finalStack = result.stack;
        const finalDomains = result.domains;
        setDetected({ stack: finalStack, domains: finalDomains });

        // Auto-save and go to feed — no manual chip steps needed
        setSaving(true);
        const saved = await saveUserProfile({
          stack: finalStack,
          domains: finalDomains,
          goal: "side_project",
          completed: true,
          github_username: result.github_username ?? undefined,
          display_name: result.display_name ?? undefined,
          bio: result.bio ?? undefined,
          location: result.location ?? undefined,
          avatar_url: result.avatar_url ?? undefined,
          website: result.website ?? undefined,
          linkedin_url: result.linkedin_url ?? undefined,
          portfolio_url: result.portfolio_url ?? undefined,
          links: result.links ?? undefined,
          certifications: result.certifications ?? undefined,
          experience: result.experience ?? undefined,
          education: result.education ?? undefined,
        });
        if (!saved) {
          setAnalyzeError("Could not save your profile. Try filling it in manually.");
          return;
        }
        if (result.github_username) {
          syncGitHubProjects(result.github_username).catch(() => {});
        }
        setMode("done");
        router.push("/feed");
      } else {
        setAnalyzeError("Couldn't extract your profile from those links. Try filling it in manually.");
      }
    } catch {
      setAnalyzeError("Analysis failed. Try filling in your profile manually.");
    } finally {
      setAnalyzing(false);
      setSaving(false);
    }
  }

  async function finishManual() {
    if (!goal) return;
    const saved = await saveUserProfile({ stack, domains, goal, completed: true, github_username: githubUsername ?? undefined });
    if (!saved) return;
    if (githubUsername) syncGitHubProjects(githubUsername).catch(() => {});
    router.push("/feed");
  }

  // ── GitHub auto-setup loading screen ──────────────────────────────────────
  if (mode === "auto") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <BoMascot size={100} intensity="lively" excited />
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Setting up your profile…</p>
          <p className="mt-1 text-sm text-muted">Reading your GitHub repos, detecting your stack</p>
        </div>
      </div>
    );
  }

  // ── Link paste screen ──────────────────────────────────────────────────────
  if (mode === "links") {
    return (
      <div className="animate-fade-in min-h-screen">
        <NavBar right={<span className="text-xs font-medium text-[#AAAAAA]">Setup</span>} />

        <div className="mx-auto max-w-[600px] px-10 pb-32 pt-20">
          <h1 className="mb-3 text-[44px] font-bold leading-tight tracking-tight text-foreground">
            Let&apos;s set you up
          </h1>
          <p className="mb-10 text-base leading-relaxed text-muted">
            Paste your GitHub, LinkedIn, or portfolio URL — we&apos;ll read them and create your profile automatically.
          </p>

          <textarea
            value={links}
            onChange={(e) => { setLinks(e.target.value); setAnalyzeError(""); }}
            placeholder={"https://github.com/yourusername\nhttps://linkedin.com/in/yourprofile\nhttps://yourportfolio.dev"}
            rows={5}
            className="w-full rounded-xl border border-[#E0E0DC] bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />

          {analyzeError && (
            <p className="mt-2 text-sm text-red-500">{analyzeError}</p>
          )}

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || saving || !links.trim()}
              className="flex-1 rounded-lg bg-primary px-6 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-50"
            >
              {analyzing ? "Reading your links…" : saving ? "Setting up your profile…" : "Create my profile →"}
            </button>
            <button
              onClick={() => setMode("manual-stack")}
              className="rounded-lg border border-[#E0E0DC] px-6 py-3.5 text-[15px] font-medium text-[#555550] transition-colors hover:border-[#999995]"
            >
              Fill in manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Manual flow ────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in min-h-screen">
      <NavBar
        right={
          <span className="text-xs font-medium text-[#AAAAAA]">Step {manualStep} of 3</span>
        }
      />
      <div className="h-0.5 overflow-hidden bg-[#EBEBEB]">
        <div
          className="h-0.5 rounded bg-primary transition-all duration-300"
          style={{ width: `${manualPct}%` }}
        />
      </div>

      <div className="mx-auto max-w-[680px] px-10 pb-32 pt-16">
        {mode === "manual-stack" && (
          <>
            <h1 className="mb-3 text-[44px] font-bold leading-tight tracking-tight text-foreground">
              What&apos;s your stack?
            </h1>
            <p className="mb-[52px] text-base leading-relaxed text-muted">
              Select all technologies you work with.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {STACK_OPTIONS.map((s) => {
                const on = stack.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleStack(s)}
                    className={`rounded-lg border-[1.5px] px-5 py-2.5 text-sm font-medium transition-all ${
                      on
                        ? "border-primary bg-primary font-semibold text-white shadow-sm"
                        : "border-[#E0E0DC] bg-white text-[#555550] hover:border-[#CCCCCA]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === "manual-domains" && (
          <>
            <h1 className="mb-3 text-[44px] font-bold leading-tight tracking-tight text-foreground">
              What domains do you care about?
            </h1>
            <p className="mb-[52px] text-base leading-relaxed text-muted">
              Health, climate, fintech — pick the spaces where you want to make impact.
            </p>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map((d) => {
                const on = domains.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDomain(d)}
                    className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all ${
                      on
                        ? "border-primary bg-primary font-semibold text-white shadow-sm"
                        : "border-[#E0E0DC] bg-white text-muted hover:border-[#CCCCCA]"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === "manual-goal" && (
          <>
            <h1 className="mb-3 text-[44px] font-bold leading-tight tracking-tight text-foreground">
              What&apos;s your builder goal?
            </h1>
            <p className="mb-[52px] text-base leading-relaxed text-muted">
              This helps us prioritize problems that fit your timeline.
            </p>
            <div className="flex flex-col gap-3">
              {GOAL_OPTIONS.map((g) => {
                const on = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`rounded-xl border-2 px-6 py-5 text-left text-lg font-semibold transition-all ${
                      on
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-[#E0E0DC] bg-white text-foreground hover:border-[#CCCCCA]"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-14 flex items-center justify-between pt-8">
          <button
            onClick={() => {
              if (mode === "manual-stack") setMode("links");
              if (mode === "manual-domains") setMode("manual-stack");
              if (mode === "manual-goal") setMode("manual-domains");
            }}
            className="rounded-lg border border-[#E0E0DC] px-6 py-3 text-sm font-medium text-[#555550] transition-colors hover:border-[#999995]"
          >
            ← Back
          </button>

          <button
            onClick={() => {
              if (mode === "manual-stack") setMode("manual-domains");
              else if (mode === "manual-domains") setMode("manual-goal");
              else if (mode === "manual-goal") finishManual();
            }}
            disabled={mode === "manual-goal" && !goal}
            className="rounded-lg bg-primary px-8 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-40"
          >
            {mode === "manual-goal" ? "Start exploring →" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
