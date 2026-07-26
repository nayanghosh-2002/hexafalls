import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ solutions: [] });
    }

    // 1. Fetch solutions and problems safely without direct relation joins
    const { data: solutions, error: solutionsError } = await supabase
      .from("problem_solutions")
      .select(`
        id,
        problem_id,
        user_id,
        github_repo_url,
        code_snippet,
        language,
        submitted_at,
        parent_solution_id,
        problems (
          headline,
          domain,
          difficulty
        )
      `)
      .eq("is_published", true)
      .order("submitted_at", { ascending: false });

    if (solutionsError || !solutions) {
      console.error("Error fetching community solutions:", solutionsError);
      return NextResponse.json({ solutions: [] });
    }

    // 2. Extract unique user IDs and fetch their profiles manually
    const userIds = [...new Set(solutions.map((s) => s.user_id))];
    let profiles: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url, github_username")
        .in("user_id", userIds);
        
      if (profilesData) profiles = profilesData;
    }

    // 3. Fetch ratings for these solutions
    const solutionIds = solutions.map((s) => s.id);
    let ratings: any[] = [];
    
    if (solutionIds.length > 0) {
      const { data: ratingsData } = await supabase
        .from("solution_ratings")
        .select("solution_id, rating")
        .in("solution_id", solutionIds);
        
      if (ratingsData) ratings = ratingsData;
    }

    // 4. Merge data cleanly in memory
    const enriched = solutions.map((sol) => {
      const profile = profiles.find((p) => p.user_id === sol.user_id) || {
        display_name: "Community Builder",
        avatar_url: null,
        github_username: null
      };
      
      const solRatings = ratings.filter((r) => r.solution_id === sol.id);
      const avgRating = solRatings.length > 0
          ? Number((solRatings.reduce((a, b) => a + (b.rating || 0), 0) / solRatings.length).toFixed(1))
          : 0;

      return {
        ...sol,
        user_profiles: profile,
        avgRating,
        ratingCount: solRatings.length,
      };
    });

    return NextResponse.json({ solutions: enriched });
  } catch (err) {
    console.error("Community API Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}