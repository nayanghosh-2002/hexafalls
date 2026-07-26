"use client";

import { useEffect, useState } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import {CodeSandboxRunner} from "@/components/CodeSandboxRunner";
import { getAuthHeaders } from "@/lib/user-client";

// Language boilerplate templates for starter modifications
const CODE_TEMPLATES: Record<string, string> = {
  typescript: `// TypeScript Solution\nfunction solveProblem(input: string): string {\n  console.log("Processing input:", input);\n  return "Solution completed cleanly!";\n}\n\nsolveProblem("Test run");`,
  javascript: `// JavaScript Solution\nfunction solveProblem(input) {\n  console.log("Processing input:", input);\n  return "Solution completed cleanly!";\n}\n\nsolveProblem("Test run");`,
  python: `# Python Solution\ndef solve_problem(input_data):\n    print(f"Processing input: {input_data}")\n    return "Solution completed cleanly!"\n\nsolve_problem("Test run")`,
  html: `<!-- HTML / CSS Live Preview Solution -->\n<!DOCTYPE html>\n<html>\n  <head>\n    <style>\n      body { font-family: sans-serif; padding: 20px; background: #f0f4f8; }\n      .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }\n      h1 { color: #1B3A6B; }\n    </style>\n  </head>\n  <body>\n    <div class="card">\n      <h1>🚀 Solution UI Preview</h1>\n      <p>Edit this HTML/CSS to render your solution UI dynamically in the sandbox!</p>\n    </div>\n  </body>\n</html>`,
};

interface SolutionItem {
  id: string;
  problem_id: string;
  user_id: string;
  code_snippet: string;
  language: string;
  github_repo_url: string;
  submitted_at: string;
  avgRating: number;
  ratingCount: number;
  parent_solution_id?: string;
  problems?: {
    headline: string;
    domain: string;
    difficulty: string;
  };
  user_profiles?: {
    display_name?: string;
    avatar_url?: string;
    github_username?: string;
  };
}

interface LeaderboardUser {
  userId: string;
  solvedCount: number;
  avgRating: number;
  score: number;
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"solutions" | "leaderboard">("solutions");
  const [solutions, setSolutions] = useState<SolutionItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected solution for live execution or modification
  const [activeSolution, setActiveSolution] = useState<SolutionItem | null>(null);

  // Modification Mode State
  const [isModifying, setIsModifying] = useState(false);
  const [originalCode, setOriginalCode] = useState("");
  const [modifiedCode, setModifiedCode] = useState("");
  const [modifiedLang, setModifiedLanguage] = useState("typescript");
  const [githubToken, setGithubToken] = useState("");
  const [savingModification, setSavingModification] = useState(false);

  // Rating State
  const [userRating, setUserRating] = useState(5);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [solRes, leadRes] = await Promise.all([
          fetch("/api/community/solutions"),
          fetch("/api/leaderboard"),
        ]);

        if (solRes.ok) {
          const solData = await solRes.json();
          setSolutions(solData.solutions ?? []);
          if (solData.solutions?.length > 0) {
            setActiveSolution(solData.solutions[0]);
          }
        }

        if (leadRes.ok) {
          const leadData = await leadRes.json();
          setLeaderboard(leadData.leaderboard ?? []);
        }
      } catch (err) {
        console.error("Failed to load community data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleSelectSolution(sol: SolutionItem) {
    setActiveSolution(sol);
    setIsModifying(false);
  }

  function handleStartModification(sol: SolutionItem) {
    setActiveSolution(sol);
    setOriginalCode(sol.code_snippet);
    setModifiedCode(sol.code_snippet + "\n\n// Added community improvement:\n");
    setModifiedLanguage(sol.language || "typescript");
    setIsModifying(true);
  }

  function handleLanguageChange(newLang: string) {
    setModifiedLanguage(newLang);
    if (!modifiedCode || modifiedCode === originalCode) {
      setModifiedCode(CODE_TEMPLATES[newLang] || CODE_TEMPLATES.typescript);
    }
  }

  async function handleSaveModifiedCode() {
    if (!activeSolution) return;
    setSavingModification(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/building/ship", {
        method: "POST",
        headers,
        body: JSON.stringify({
          problemId: activeSolution.problem_id,
          code: modifiedCode,
          language: modifiedLang,
          githubToken: githubToken.trim() || undefined,
          parentSolutionId: activeSolution.id,
          repoName: `sealit-mod-${activeSolution.problem_id.slice(0, 5)}`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("🎉 Modified solution published with diff history!");
        setIsModifying(false);

        // Refresh solutions list
        const solRes = await fetch("/api/community/solutions");
        if (solRes.ok) {
          const solData = await solRes.json();
          setSolutions(solData.solutions ?? []);
        }
      } else {
        alert(`Error saving modification: ${data.error || "Failed to submit"}`);
      }
    } catch {
      alert("Network error while publishing modified solution.");
    } finally {
      setSavingModification(false);
    }
  }

  async function handleRateSolution(solutionId: string) {
    setSubmittingRating(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/community/rate", {
        method: "POST",
        headers,
        body: JSON.stringify({ solutionId, rating: userRating }),
      });

      if (res.ok) {
        alert("★ Thank you! Rating saved.");
        const refreshed = await fetch("/api/community/solutions").then((r) => r.json());
        setSolutions(refreshed.solutions ?? []);
      } else {
        alert("Failed to save rating.");
      }
    } catch {
      alert("Error submitting rating.");
    } finally {
      setSubmittingRating(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-muted">Loading Sealit Community Hub...</div>;
  }

  return (
    <div className="px-6 py-8 md:px-10 space-y-8 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Community Showcase</span>
          <h1 className="text-3xl font-serif font-bold text-foreground mt-1">Builder Hub & Solutions</h1>
        </div>

        <div className="flex rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab("solutions")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
              activeTab === "solutions" ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            🚀 Shipped Solutions ({solutions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
              activeTab === "leaderboard" ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      {activeTab === "solutions" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Solution Cards List */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-bold uppercase text-muted tracking-wider">
              Published Community Solutions
            </h2>
            {solutions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted">
                No solutions published yet. Ship code in the Building Workspace to appear here!
              </div>
            ) : (
              solutions.map((sol) => {
                const authorName =
                  sol.user_profiles?.display_name ||
                  sol.user_profiles?.github_username ||
                  `Builder ${sol.user_id.slice(0, 6)}`;

                return (
                  <div
                    key={sol.id}
                    onClick={() => handleSelectSolution(sol)}
                    className={`cursor-pointer rounded-2xl border p-5 transition-all space-y-3 ${
                      activeSolution?.id === sol.id
                        ? "border-primary bg-primary-light/20 shadow-sm ring-1 ring-primary/30"
                        : "border-border bg-surface hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded bg-primary-light px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {sol.problems?.domain || "General"}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        ★ {sol.avgRating > 0 ? sol.avgRating : "New"} ({sol.ratingCount})
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground line-clamp-1">
                      {sol.problems?.headline || "Problem Solution"}
                    </h3>

                    {sol.parent_solution_id && (
                      <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        ⚡ Community Improvement (Fork)
                      </span>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/50">
                      <span className="font-semibold text-foreground">By: {authorName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartModification(sol);
                        }}
                        className="rounded bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary/90"
                      >
                        ✏️ Modify & Compare Diff
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Code Preview, Monaco Diff View & Sandbox Execution */}
          <div className="lg:col-span-7 space-y-6">
            {activeSolution ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    {isModifying ? "🔍 Highlighting Differences (Diff Mode)" : "💻 Solution Preview & Sandbox"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsModifying(!isModifying)}
                    className="text-xs font-bold text-primary underline"
                  >
                    {isModifying ? "Exit Diff View" : "✏️ Modify Code"}
                  </button>
                </div>

                {isModifying ? (
                  /* Monaco Side-by-Side Diff Editor */
                  <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm space-y-4">
                    <div className="bg-surface-muted px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-muted">Syntax:</span>
                        <select
                          value={modifiedLang}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="rounded border border-border bg-surface px-2 py-1 text-xs font-semibold text-foreground"
                        >
                          <option value="typescript">TypeScript (.ts)</option>
                          <option value="javascript">JavaScript (.js)</option>
                          <option value="python">Python (.py)</option>
                          <option value="html">HTML/CSS (.html)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          placeholder="GitHub PAT (Optional)"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          className="rounded border border-border bg-surface px-2 py-1 text-xs w-40"
                        />
                        <button
                          type="button"
                          onClick={handleSaveModifiedCode}
                          disabled={savingModification}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {savingModification ? "Publishing..." : "Publish Modified Version"}
                        </button>
                      </div>
                    </div>

                    <div className="h-[380px] w-full">
                      <DiffEditor
                        height="100%"
                        theme="vs-dark"
                        language={modifiedLang}
                        original={originalCode}
                        modified={modifiedCode}
                        onMount={(editor) => {
                          editor.getModifiedEditor().onDidChangeModelContent(() => {
                            setModifiedCode(editor.getModifiedEditor().getValue());
                          });
                        }}
                        options={{
                          fontSize: 13,
                          renderSideBySide: true,
                          minimap: { enabled: false },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Live WASM Code Execution Sandbox */
                  <CodeSandboxRunner code={activeSolution.code_snippet} language={activeSolution.language} />
                )}

                {/* Rating & Review Box */}
                <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
                  <h3 className="text-sm font-bold text-foreground">Rate this Solution</h3>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className={`text-2xl ${star <= userRating ? "text-amber-400" : "text-gray-300"}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-foreground ml-2">{userRating} / 5 Stars</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRateSolution(activeSolution.id)}
                    disabled={submittingRating}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submittingRating ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-12 text-center text-xs text-muted">
                Select a solution on the left to view, modify, or run code in the browser sandbox.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Builder Leaderboard View */
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-surface-muted flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase text-foreground">Top Builder Standings</h2>
            <span className="text-xs text-muted">Ranked by Problems Solved & Peer Ratings</span>
          </div>

          <div className="divide-y divide-border">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">No ranked builders yet.</div>
            ) : (
              leaderboard.map((builder, idx) => (
                <div key={builder.userId} className="p-5 flex items-center justify-between hover:bg-surface-subtle">
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-black text-xs ${
                        idx === 0
                          ? "bg-amber-400 text-black"
                          : idx === 1
                          ? "bg-gray-300 text-black"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-surface-muted text-foreground"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Builder {builder.userId.slice(0, 8)}</p>
                      <p className="text-xs text-muted">Score: {Math.round(builder.score)} pts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-base font-black text-primary">{builder.solvedCount}</p>
                      <p className="text-[10px] font-medium uppercase text-muted">Problems Shipped</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-amber-500">
                        {builder.avgRating > 0 ? `${builder.avgRating} ★` : "N/A"}
                      </p>
                      <p className="text-[10px] font-medium uppercase text-muted">Avg Rating</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}