import { scrapeAllSources } from "./scraper";
import { structureProblem, createFallbackProblem } from "./gemini";
import {
  insertProblem,
  problemExistsByUrl,
  isSupabaseConfigured,
  fetchProblems,
  fetchProblemById,
} from "./supabase";
import type { Problem, RawPost } from "./types";
import { enrichProblem } from "./opportunity-score";

const GEMINI_CONCURRENCY = 3;

async function processPost(post: RawPost): Promise<{
  added?: Problem;
  skipped?: true;
  error?: string;
}> {
  try {
    if (await problemExistsByUrl(post.url)) {
      return { skipped: true };
    }

    let structured: StructuredProblem | null = null;

    try {
      // 1. Try Gemini first
      structured = await structureProblem(post);
    } catch (geminiErr) {
      console.warn(`Gemini failed for "${post.title.slice(0, 40)}". Using fallback card data.`);
      // 2. Fall back to static card generation when Gemini fails or rate limits
      structured = createFallbackProblem(post);
    }

    // If structureProblem returned null without throwing
    if (!structured) {
      structured = createFallbackProblem(post);
    }

    // Drop anything where a solid solution already exists
    if ((structured.solution_exists_score ?? 0) >= 7) {
      return { skipped: true };
    }

    // 3. Insert into Supabase (works with AI output OR fallback data)
    const { problem: inserted, error: insertError } = await insertProblem({
      headline: structured.headline,
      description: structured.description,
      domain: structured.domain,
      difficulty: structured.difficulty,
      context: structured.context,
      tried_before: structured.tried_before,
      builders_count: 0,
      builders_started_pct: 0,
      source: post.source,
      source_url: post.url,
      raw_post: `${post.title}\n\n${post.body}`,
      time_estimate: structured.time_estimate,
      tags: structured.tags,
      opportunity_score: structured.opportunity_score,
      solution_exists_score: structured.solution_exists_score,
      gap_analysis: structured.gap_analysis || undefined,
    });

    if (inserted) return { added: inserted };
    if (insertError) return { error: `DB save failed: ${insertError}` };
    return {};
  } catch (err) {
    return { error: `Error processing "${post.title.slice(0, 60)}": ${err}` };
  }
}

export async function runScrapePipeline(): Promise<{
  scraped: number;
  added: Problem[];
  skipped: number;
  sources: { reddit: number; hn: number };
  warnings: string[];
  errors: string[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      scraped: 0, added: [], skipped: 0, sources: { reddit: 0, hn: 0 }, warnings: [],
      errors: ["Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and keys in .env.local"],
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      scraped: 0, added: [], skipped: 0, sources: { reddit: 0, hn: 0 }, warnings: [],
      errors: ["GEMINI_API_KEY is required to structure scraped posts"],
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      scraped: 0, added: [], skipped: 0, sources: { reddit: 0, hn: 0 }, warnings: [],
      errors: ["SUPABASE_SERVICE_ROLE_KEY is required. Add it from Supabase → Settings → API → service_role key."],
    };
  }

  const { posts, warnings, sources } = await scrapeAllSources();
  if (posts.length === 0) {
    return {
      scraped: 0, added: [], skipped: 0, sources, warnings,
      errors: ["Could not fetch posts from Reddit or Hacker News."],
    };
  }

  const added: Problem[] = [];
  const errors: string[] = [];
  let skipped = 0;
  let geminiBlocked = false;

  for (let i = 0; i < posts.length; i += GEMINI_CONCURRENCY) {
    if (geminiBlocked) break;

    const batch = posts.slice(i, i + GEMINI_CONCURRENCY);
    const results = await Promise.all(batch.map(processPost));

    for (const r of results) {
      if (r.added) added.push(r.added);
      if (r.skipped) skipped++;
      if (r.error) {
        errors.push(r.error);
        if (
          r.error.includes("spending cap") ||
          r.error.includes("Gemini API limit") ||
          r.error.includes("rate limited") ||
          r.error.includes("quota")
        ) {
          geminiBlocked = true;
        }
      }
    }

    if (!geminiBlocked && i + GEMINI_CONCURRENCY < posts.length) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  if (geminiBlocked) {
    errors.unshift(
      "Gemini API limit hit. Showing existing stored problem cards."
    );
  }

  return { scraped: posts.length, added, skipped, sources, warnings, errors };
}

export async function getAllProblems(): Promise<Problem[]> {
  if (!isSupabaseConfigured()) return [];
  const problems = await fetchProblems();
  return problems.map(enrichProblem);
}

export async function getProblem(id: string): Promise<Problem | null> {
  if (!isSupabaseConfigured()) return null;
  const problem = await fetchProblemById(id);
  return problem ? enrichProblem(problem) : null;
}