import { NextRequest, NextResponse } from "next/server";
import { generateBuildIdeas } from "@/lib/gemini";
import { getProblem } from "@/lib/pipeline";
import { getUserFromRequest } from "@/lib/api-auth";
import { getUserProfile } from "@/lib/user-data";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { problemId, stack: bodyStack } = body as {
    problemId: string;
    stack?: string[];
  };

  const problem = await getProblem(problemId);
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  let stack = bodyStack ?? [];
  if (stack.length === 0) {
    const profile = await getUserProfile(user.id);
    stack = profile?.stack ?? [];
  }

  const { ideas, stackUsed, error } = await generateBuildIdeas(
    {
      headline: problem.headline,
      context: problem.context,
      tried_before: problem.tried_before,
      domain: problem.domain,
    },
    stack
  );

  if (error) {
    return NextResponse.json({ ideas: [], stackUsed, error }, { status: 503 });
  }

  return NextResponse.json({ ideas, stackUsed });
}
