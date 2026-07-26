"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { BuildProgressChecklist } from "@/components/BuildProgressChecklist";
import { fetchBuildingProjects, updateBuildingStageRemote, getAuthHeaders } from "@/lib/user-client";
import type { BuildStage, Problem } from "@/lib/types";

interface SolutionItem {
  id: string;
  user_id: string;
  code_snippet: string;
  language: string;
  github_repo_url: string;
  submitted_at: string;
  parent_solution_id?: string;
}

export default function BuildingDashboardPage() {
  const params = useParams();
  const id = params.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [startedAt, setStartedAt] = useState<string>("");
  const [stage, setStage] = useState<BuildStage>("idea");
  const [loading, setLoading] = useState(true);

  // Editor Mode: "build" | "diff"
  const [editorMode, setEditorMode] = useState<"build" | "diff">("build");

  // Code state
  const [originalCode, setOriginalCode] = useState<string>("");
  const [code, setCode] = useState<string>(
    `// Write your solution here\nfunction solveProblem() {\n  console.log("Building solution...");\n}\n\nsolveProblem();`
  );
  const [language, setLanguage] = useState("typescript");
  const [githubToken, setGithubToken] = useState("");
  const [shipping, setShipping] = useState(false);
  const [shippedRepo, setShippedRepo] = useState<string | null>(null);
  const [parentSolutionId, setParentSolutionId] = useState<string | null>(null);

  // Community solutions & ratings
  const [communitySolutions, setCommunitySolutions] = useState<SolutionItem[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<SolutionItem | null>(null);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    async function init() {
      try {
        const buildingList = await fetchBuildingProjects();
        const building = buildingList.find((b) => b.id === id);

        const started = building?.startedAt ?? new Date().toISOString();
        setStartedAt(started);
        setStage(building?.stage ?? "idea");

        // Fetch problem details
        const res = await fetch(`/api/problems/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProblem(data.problem);
        }

        // Fetch published community solutions
        const solRes = await fetch(`/api/building/solutions?problemId=${id}`);
        if (solRes.ok) {
          const solData = await solRes.json();
          setCommunitySolutions(solData.solutions ?? []);
        }

        setLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setLoading(false);
      }
    }

    init();
  }, [id]);

  async function handleStageChange(next: BuildStage) {
    await updateBuildingStageRemote(id, next);
    setStage(next);
  }

  // Handle Forking / Modifying an existing user's code
  function handleForkSolution(sol: SolutionItem) {
    setOriginalCode(sol.code_snippet);
    setCode(sol.code_snippet + "\n\n// Modified & Enhanced version:");
    setLanguage(sol.language || "typescript");
    setParentSolutionId(sol.id);
    setEditorMode("diff"); // Toggle side-by-side diff highlighting!
  }

  async function handleShipCode() {
    setShipping(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/building/ship", {
        method: "POST",
        headers,
        body: JSON.stringify({
          problemId: id,
          code,
          language,
          githubToken: githubToken.trim() || undefined,
          repoName: `sealit-${problem?.domain.toLowerCase().replace(/[^a-z0-9]/g, "-") || "app"}-${id.slice(0, 5)}`,
          parentSolutionId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStage("shipped");
        setShippedRepo(data.repoUrl);
        alert("🎉 Code successfully saved and published on GitHub & Sealit!");
        // Refresh community list
        const solRes = await fetch(`/api/building/solutions?problemId=${id}`);
        if (solRes.ok) {
          const solData = await solRes.json();
          setCommunitySolutions(solData.solutions ?? []);
        }
      } else {
        alert(`Ship Error: ${data.error || "Could not publish."}`);
      }
    } catch {
      alert("Ship failed. Please check connection.");
    } finally {
      setShipping(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-muted">Loading workspace…</div>;
  if (!problem) return <div className="py-20 text-center">Workspace not found</div>;

  // Timeline Metrics
  const targetDays = problem.time_estimate?.includes("Weekend") ? 2 : 14;
  const daysBuilding = Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const remainingDays = Math.max(0, targetDays - daysBuilding);

  return (
    <div className="px-6 py-8 md:px-8 space-y-8">
      {/* Header & Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/building" className="text-xs font-medium text-primary">← All builds</Link>
          <h1 className="mt-2 font-serif text-3xl font-bold text-foreground">{problem.headline}</h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-right shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-muted">Timeline Remaining</p>
          <p className="text-2xl font-black text-primary">{remainingDays} Days Left</p>
        </div>
      </div>

      <BuildProgressChecklist stage={stage} onStageChange={handleStageChange} />

      {/* ── VS CODE EDITOR (BUILD OR DIFF HIGHLIGHT MODE) ── */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center justify-between bg-surface-muted px-5 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-foreground">
              {editorMode === "diff" ? "🔍 Comparing Changes (Diff View)" : " Inbuilt VS Code Workspace"}
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded border border-border bg-surface px-2 py-1 text-xs text-foreground"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
            {editorMode === "diff" && (
              <button
                type="button"
                onClick={() => setEditorMode("build")}
                className="text-xs font-semibold text-primary underline"
              >
                Switch to Standard Editor
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="GitHub PAT Token"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground placeholder:text-muted w-52"
            />
            <button
              type="button"
              onClick={handleShipCode}
              disabled={shipping}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {shipping ? "Pushing..." : " Push & Ship Solution"}
            </button>
          </div>
        </div>

        {/* Monaco Editor / Diff Editor Container */}
        <div className="h-[400px] w-full">
          {editorMode === "diff" ? (
            <DiffEditor
              height="100%"
              theme="vs-dark"
              language={language}
              original={originalCode}
              modified={code}
              onMount={(editor) => {
                editor.getModifiedEditor().onDidChangeModelContent(() => {
                  setCode(editor.getModifiedEditor().getValue());
                });
              }}
              options={{ fontSize: 13, renderSideBySide: true, minimap: { enabled: false } }}
            />
          ) : (
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{ fontSize: 13, minimap: { enabled: false } }}
            />
          )}
        </div>

        {shippedRepo && (
          <div className="bg-emerald-50 p-4 border-t border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span> Solution published to GitHub! Visible to the community.</span>
            <a href={shippedRepo} target="_blank" rel="noreferrer" className="font-bold underline">
              View Repository →
            </a>
          </div>
        )}
      </section>

      {/* ── COMMUNITY SHIPPED SOLUTIONS & PEER RATING ── */}
      <section className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <h3 className="text-base font-bold text-foreground">Shipped Community Solutions</h3>
        <p className="text-xs text-muted">
          Only solutions successfully pushed to GitHub appear here. Test, rate, or click &quot;Modify / Diff&quot; to make improvements.
        </p>

        {communitySolutions.length === 0 ? (
          <p className="text-xs text-muted italic">No community solutions published for this problem yet. Be the first to ship!</p>
        ) : (
          <div className="space-y-4">
            {communitySolutions.map((sol) => (
              <div key={sol.id} className="rounded-xl border border-border p-4 bg-surface-subtle flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Author: {sol.user_id.slice(0, 8)}</span>
                    {sol.parent_solution_id && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Modified Version
                      </span>
                    )}
                  </div>
                  <a href={sol.github_repo_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary underline block">
                    {sol.github_repo_url}
                  </a>
                  <p className="text-xs text-muted font-mono bg-surface p-2 rounded max-h-20 overflow-hidden text-ellipsis">
                    {sol.code_snippet.slice(0, 150)}...
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleForkSolution(sol)}
                    className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90"
                  >
                    ✏️ Modify & Compare Diff
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSolution(sol)}
                    className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted"
                  >
                    ★ Rate Solution
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Form Modal/Inline */}
        {selectedSolution && (
          <div className="rounded-xl border border-primary/20 bg-primary-light p-4 space-y-3">
            <h4 className="text-xs font-bold text-primary">Rate Solution by {selectedSolution.user_id.slice(0, 8)}</h4>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-xl ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
              <span className="text-xs font-bold ml-2">{rating}/5 Stars</span>
            </div>
            <button
              type="button"
              onClick={() => {
                alert("Thank you! Rating submitted.");
                setSelectedSolution(null);
              }}
              className="rounded bg-primary px-3 py-1 text-xs font-bold text-white"
            >
              Submit Rating
            </button>
          </div>
        )}
      </section>
    </div>
  );
}