import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ solutions: [], stats: { solvedCount: 0, avgRating: 0 } });
    }

    // 1. Fetch user's shipped solutions joined with problem details
    const { data: solutions, error } = await supabase
      .from("problem_solutions")
      .select(`
        id,
        problem_id,
        github_repo_url,
        code_snippet,
        language,
        submitted_at,
        problems (
          headline,
          domain,
          difficulty
        )
      `)
      .eq("user_id", user.id)
      .eq("is_published", true)
      .order("submitted_at", { ascending: false });

    if (error || !solutions) {
      return NextResponse.json({ solutions: [], stats: { solvedCount: 0, avgRating: 0 } });
    }

    // 2. Fetch all ratings for these solutions
    const solutionIds = solutions.map((s) => s.id);
    let avgRating = 0;

    if (solutionIds.length > 0) {
      const { data: ratings } = await supabase
        .from("solution_ratings")
        .select("rating")
        .in("solution_id", solutionIds);

      if (ratings && ratings.length > 0) {
        const sum = ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        avgRating = Number((sum / ratings.length).toFixed(1));
      }
    }

    return NextResponse.json({
      solutions,
      stats: {
        solvedCount: solutions.length,
        avgRating,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}