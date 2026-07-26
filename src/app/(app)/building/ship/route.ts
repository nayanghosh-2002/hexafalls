import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { getSupabase } from "@/lib/supabase";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { problemId, code, language, repoName, githubToken, parentSolutionId } = await req.json();

    if (!problemId || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let repoUrl = "";
    let pushedToGitHub = false;

    // 1. Push to GitHub if token provided
    if (githubToken) {
      try {
        const ghHeaders = {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Sealit-App",
        };

        const createRepoRes = await axios.post(
          "https://api.github.com/user/repos",
          { name: repoName || `sealit-${problemId.slice(0, 8)}`, auto_init: true },
          { headers: ghHeaders }
        );

        repoUrl = createRepoRes.data.html_url;
        const owner = createRepoRes.data.owner.login;
        const repo = createRepoRes.data.name;

        const ext = language === "python" ? "py" : language === "javascript" ? "js" : "ts";
        await axios.put(
          `https://api.github.com/repos/${owner}/${repo}/contents/solution.${ext}`,
          {
            message: "feat: submit solution on Sealit",
            content: Buffer.from(code).toString("base64"),
          },
          { headers: ghHeaders }
        );

        pushedToGitHub = true;
      } catch (ghErr) {
        console.warn("GitHub Push failed:", ghErr);
      }
    }

    if (!repoUrl) repoUrl = `https://github.com/sealit-solutions/${problemId.slice(0, 8)}`;

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "DB Error" }, { status: 500 });

    // 2. Save solution as published
    const { data: solution, error } = await supabase
      .from("problem_solutions")
      .upsert(
        {
          problem_id: problemId,
          user_id: user.id,
          code_snippet: code,
          language: language || "typescript",
          github_repo_url: repoUrl,
          is_published: true, // Key: Now visible to community
          parent_solution_id: parentSolutionId || null,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "problem_id,user_id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, solution, repoUrl, pushedToGitHub });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}