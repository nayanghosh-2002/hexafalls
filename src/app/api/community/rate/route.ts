import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { solutionId, rating, feedback } = await req.json();
    if (!solutionId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "DB error" }, { status: 500 });

    const { error } = await supabase.from("solution_ratings").upsert(
      {
        solution_id: solutionId,
        user_id: user.id,
        rating: Math.min(5, Math.max(1, rating)),
        feedback: feedback || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "solution_id,user_id" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}