import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Problem } from "./types";

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!supabase) {
    supabase = createClient(url, key);
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export async function fetchProblems(limit = 200): Promise<Problem[]> {
  const client = getSupabase();
  if (!client) return [];

  // Try the RPC function for true random ordering (requires schema migration)
  const { data: rpcData, error: rpcError } = await client
    .rpc("get_random_problems", { limit_count: limit });

  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    return rpcData as Problem[];
  }

  // Fallback: fetch a large page and shuffle in JS for variety on each refresh
  const { data, error } = await client
    .from("problems")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  const all = (data ?? []) as Problem[];
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, limit);
}

export async function fetchProblemById(id: string): Promise<Problem | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("problems")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Problem;
}

const COLUMN_NOT_FOUND = /Could not find the '(\w+)' column/;

export async function insertProblem(
  problem: Omit<Problem, "id" | "created_at">
): Promise<{ problem: Problem | null; error: string | null }> {
  const client = getSupabase();
  if (!client) {
    return { problem: null, error: "Supabase client not configured" };
  }

  const { data, error } = await client
    .from("problems")
    .insert(problem)
    .select()
    .single();

  if (error) {
    // Graceful degradation: if new columns don't exist yet, retry without them.
    // Run the migration SQL in Supabase dashboard to unlock these fields.
    if (COLUMN_NOT_FOUND.test(error.message)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { solution_exists_score: _score, gap_analysis: _gap, ...core } = problem;
      const { data: fallback, error: e2 } = await client
        .from("problems")
        .insert(core)
        .select()
        .single();
      if (e2) {
        console.error("Supabase insert error (fallback):", e2);
        return { problem: null, error: e2.message };
      }
      return { problem: fallback as Problem, error: null };
    }

    console.error("Supabase insert error:", error);
    return { problem: null, error: error.message };
  }

  return { problem: data as Problem, error: null };
}

export async function problemExistsByUrl(url: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { data } = await client
    .from("problems")
    .select("id")
    .eq("source_url", url)
    .maybeSingle();

  return Boolean(data);
}
