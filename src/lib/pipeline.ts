import { scrapeAllSources } from "./scraper";
import { structureProblem } from "./gemini";
import {
  insertProblem,
  problemExistsByUrl,
  isSupabaseConfigured,
  fetchProblems,
  fetchProblemById,
} from "./supabase";
import type { Problem, RawPost } from "./types";
import { enrichProblem } from "./opportunity-score";

// How many posts to send to Gemini at the same time.
// Keep this at 10 — fine for Google AI Studio paid tier and won't hammer free tier.
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

    const structured = await structureProblem(post);
    if (!structured) {
      return { error: `Gemini could not structure: ${post.title.slice(0, 80)}` };
    }

    // Drop anything where a solid solution already exists
    if ((structured.solution_exists_score ?? 0) >= 7) {
      return { skipped: true };
    }

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

  // Process posts in parallel batches to stay within Gemini rate limits
  for (let i = 0; i < posts.length; i += GEMINI_CONCURRENCY) {
    if (geminiBlocked) break;

    const batch = posts.slice(i, i + GEMINI_CONCURRENCY);
    const results = await Promise.all(batch.map(processPost));

    for (const r of results) {
      if (r.added) added.push(r.added);
      if (r.skipped) skipped++;
      if (r.error) {
        errors.push(r.error);
        // If Gemini is quota/cap blocked, stop processing the rest of the batch
        if (r.error.includes("spending cap") || r.error.includes("Gemini API limit")) {
          geminiBlocked = true;
        }
      }
    }

    // Brief pause between batches so we don't burst the rate limit
    if (!geminiBlocked && i + GEMINI_CONCURRENCY < posts.length) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  if (geminiBlocked) {
    errors.unshift(
      "Gemini API spending cap hit. Go to ai.studio/spend to increase your cap."
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
