import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ leaderboard: [] });

    // Fetch all solutions
    const { data: solutions } = await supabase
      .from("problem_solutions")
      .select("id, user_id, submitted_at")
      .eq("is_published", true);

    if (!solutions || solutions.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Fetch all ratings
    const solutionIds = solutions.map((s) => s.id);
    const { data: ratings } = await supabase
      .from("solution_ratings")
      .select("solution_id, rating")
      .in("solution_id", solutionIds);

    // Group stats by user_id
    const userStats: Record<string, { userId: string; solvedCount: number; totalRating: number; totalReviews: number }> = {};

    for (const sol of solutions) {
      if (!userStats[sol.user_id]) {
        userStats[sol.user_id] = { userId: sol.user_id, solvedCount: 0, totalRating: 0, totalReviews: 0 };
      }
      userStats[sol.user_id].solvedCount += 1;

      const solRatings = (ratings ?? []).filter((r) => r.solution_id === sol.id);
      solRatings.forEach((r) => {
        userStats[sol.user_id].totalRating += r.rating || 0;
        userStats[sol.user_id].totalReviews += 1;
      });
    }

    const leaderboard = Object.values(userStats)
      .map((u) => ({
        userId: u.userId,
        solvedCount: u.solvedCount,
        avgRating: u.totalReviews > 0 ? Number((u.totalRating / u.totalReviews).toFixed(1)) : 0,
        score: u.solvedCount * 10 + (u.totalReviews > 0 ? (u.totalRating / u.totalReviews) * 5 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ leaderboard });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}