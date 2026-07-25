"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BoMascot } from "@/components/BoMascot";
import { authFetchJson, getAuthHeaders } from "@/lib/user-client";
import type { UserProject, ProjectAnalysis } from "@/lib/types";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3572A5", Go: "#00ADD8",
  Rust: "#dea584", Swift: "#F05138", Kotlin: "#7F52FF", Java: "#b07219",
  "C++": "#f34b7d", Ruby: "#701516", PHP: "#4F5D95", CSS: "#563d7c",
  HTML: "#e34c26", Shell: "#89e051", Vue: "#41b883", Svelte: "#ff3e00",
};

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 64;
  const circ = 2 * Math.PI * radius;
  const fill = (clamped / 100) * circ;
  const color = clamped >= 70 ? "#22c55e" : clamped >= 40 ? "#f59e0b" : "#ef4444";
  const label = clamped >= 70 ? "Strong" : clamped >= 40 ? "Decent" : "Needs Work";
  const labelColor = clamped >= 70 ? "text-emerald-600 bg-emerald-50" : clamped >= 40 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="168" height="168" viewBox="0 0 168 168">
        <circle cx="84" cy="84" r={radius} fill="none" stroke="#F0F0EE" strokeWidth="12" />
        <circle
          cx="84" cy="84" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 84 84)"
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
        <text x="84" y="78" textAnchor="middle" fontSize="34" fontWeight="800" fill={color}>{clamped}</text>
        <text x="84" y="100" textAnchor="middle" fontSize="13" fill="#AAAAAA">/ 100</text>
      </svg>
      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${labelColor}`}>{label}</span>
    </div>
  );
}

function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-bold text-foreground">{value}</p>
        <p className="text-[11px] text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const [project, setProject] = useState<UserProject | null>(null);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const autoTriggered = useRef(false);

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authFetchJson<{ project: UserProject }>(`/api/project/${owner}/${repo}`);
      if (data?.project) {
        setProject(data.project);
        setAnalysis(data.project.analysis ?? null);
      }
    } catch {
      setError("Project not found");
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => { loadProject(); }, [loadProject]);

  // Auto-analyse when page loads with no existing analysis
  useEffect(() => {
    if (!loading && !analysis && !autoTriggered.current) {
      autoTriggered.current = true;
      runAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, analysis]);

  async function runAnalysis() {
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch(`/api/project/${owner}/${repo}`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      const text = await res.text();
      let data: { analysis?: ProjectAnalysis; error?: string } = {};
      try { data = JSON.parse(text); } catch {
        // Non-JSON response — likely a Vercel timeout
        setError("Analysis timed out — please try again");
        return;
      }
      if (data?.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError(data?.error ?? "Analysis failed — please try again");
      }
    } catch {
      setError("Analysis failed — check your connection and try again");
    } finally {
      setAnalyzing(false);
    }
  }

  const lastUpdated = project?.analysis_updated_at
    ? new Date(project.analysis_updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const langColor = project?.language ? (LANG_COLORS[project.language] ?? "#6b7280") : null;

  return (
    <div className="px-6 py-8 md:px-10">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <h1 className="text-[32px] font-extrabold tracking-tight text-foreground">{repo}</h1>
            {langColor && project?.language && (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-[12px] font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: langColor }} />
                {project.language}
              </span>
            )}
            {project?.stars != null && project.stars > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-[12px] font-semibold text-muted">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {project.stars}
              </span>
            )}
          </div>

          {project?.description && (
            <p className="mb-3 line-clamp-2 max-w-2xl text-[14px] leading-relaxed text-muted">{project.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={project?.repo_url ?? `https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-surface-muted"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.72-4.03-1.42-4.03-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.19.7.8.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
              </svg>
              View on GitHub
            </Link>
            {project?.topics?.slice(0, 5).map((t) => (
              <span key={t} className="rounded-full bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 text-right">
          {analysis ? (
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="rounded-xl border border-border bg-white px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              {analyzing ? "Re-analyzing…" : "↻ Refresh"}
            </button>
          ) : (
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="rounded-xl bg-primary px-6 py-3 text-[14px] font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {analyzing ? "Analyzing…" : "Analyse with AI →"}
            </button>
          )}
          {lastUpdated && (
            <p className="mt-1.5 text-[11px] text-muted">Updated {lastUpdated}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[13px] font-medium text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && !analysis && !analyzing && (
        <div className="flex flex-col items-center rounded-3xl border border-border bg-white py-24 text-center">
          <BoMascot size={100} intensity="lively" excited />
          <h2 className="mt-6 text-2xl font-bold text-foreground">Starting analysis…</h2>
          <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
            Hang tight — reading the README and running the numbers.
          </p>
        </div>
      )}

      {analyzing && !analysis && (
        <div className="flex flex-col items-center rounded-3xl border border-border bg-white py-24 text-center">
          <BoMascot size={100} intensity="lively" excited />
          <h2 className="mt-6 text-2xl font-bold text-foreground">Analysing {repo}…</h2>
          <p className="mt-2 text-[14px] text-muted">Reading README, checking competitors, running numbers…</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-5">

          {/* ── SCORE HERO ── */}
          <div className="rounded-3xl border border-border bg-white p-8">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
              <ScoreRing score={analysis.completeness_score} />
              <div className="flex-1">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">Verdict</p>
                <p className="mb-5 text-[18px] font-semibold leading-snug text-foreground line-clamp-3">{analysis.verdict}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatBadge
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    }
                    value={analysis.estimated_users}
                    label="Estimated reach"
                  />
                  <StatBadge
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    }
                    value={`${analysis.improvements.length} suggestions`}
                    label="Ways to improve"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── PROBLEM + BO ── */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-white p-7">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">What it solves</p>
              <p className="text-[15px] leading-relaxed text-foreground line-clamp-5">{analysis.problem_solved}</p>
            </div>

            <div className="flex items-start gap-4 rounded-3xl border border-border bg-white p-7">
              <div className="shrink-0 mt-1">
                <BoMascot size={64} intensity="subtle" excited />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">Bo says</p>
                <p className="text-[15px] leading-relaxed text-foreground line-clamp-5">{analysis.bo_message}</p>
              </div>
            </div>
          </div>

          {/* ── IMPROVEMENTS ── */}
          <div className="rounded-3xl border border-border bg-white p-7">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-widest text-muted">How to make it better</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {analysis.improvements.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-[#F7F7F5] px-4 py-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[13px] leading-snug text-foreground line-clamp-2">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── COMPETITORS + UNIQUE ANGLE ── */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-white p-7">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-widest text-muted">Competitors</p>
              {analysis.competitors.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <p className="text-[13px] font-semibold text-emerald-700">No direct competitors — that&apos;s a great sign.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.competitors.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl bg-[#F7F7F5] px-4 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-foreground">{c.name}</p>
                        <p className="text-[12px] text-muted line-clamp-1">{c.how_different}</p>
                      </div>
                      {c.url && (
                        <Link
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5"
                        >
                          Visit →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Your unique angle</p>
              </div>
              <p className="text-[15px] leading-relaxed text-amber-900 line-clamp-6">{analysis.gaps_vs_competitors}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
