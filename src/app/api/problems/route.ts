import { NextResponse } from "next/server";
import { getAllProblems } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  const problems = await getAllProblems();
  return NextResponse.json({ problems });
}
