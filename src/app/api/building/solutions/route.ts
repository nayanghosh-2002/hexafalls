import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId");

    if (!problemId) {
      return NextResponse.json({ error: "problemId required" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ solutions: [] });
    }

    const { data: solutions, error } = await supabase
      .from("problem_solutions")
      .select("*")
      .eq("problem_id", problemId)
      .eq("is_published", true)
      .order("submitted_at", { ascending: false });

    if (error) {
      return NextResponse.json({ solutions: [] });
    }

    return NextResponse.json({ solutions: solutions ?? [] });
  } catch {
    return NextResponse.json({ solutions: [] });
  }
}