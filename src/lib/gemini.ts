import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BuildIdea, RawPost, StructuredProblem } from "./types";

// Use gemini-2.5-flash-lite by default — it has a generous free tier and is
// cheap enough to avoid the monthly spending cap under normal scrape volume.
// Override with GEMINI_MODEL=gemini-2.5-flash in .env.local for higher quality.
export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash-lite";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

const STRUCTURE_PROMPT = `You are a product analyst for Sealit, a platform that surfaces GENUINELY UNSOLVED problems for builders.

Given a raw post from Reddit or Hacker News, do two things in one response:
1. Extract a structured problem card
2. Rate whether a solid, widely-adopted solution already exists (solution_exists_score 1-10)

solution_exists_score scale:
- 1-3: No good solution exists. Genuine gap. Examples: very niche, new, or overlooked problems.
- 4-6: Partial solutions exist with significant gaps. Existing tools are clunky, expensive, or miss key use cases.
- 7-10: Solid, widely-adopted solution exists. Examples: "payment processing" (Stripe), "cloud hosting" (AWS), "email" (Gmail). Skip these.

Be honest and critical. Don't rate everything as 1-3. If established tools handle this well, say so.

Return ONLY valid JSON with this exact shape:
{
  "headline": "One compelling sentence — the core problem",
  "description": "Two sentences max — who it affects and why it matters",
  "domain": "One of: Health, Climate, FinTech, EdTech, AgriTech, LegalTech, CleanTech, Accessibility, Dev Tools, Civic Tech, Mental Health, Housing, Infrastructure, Other",
  "difficulty": "Easy | Medium | Hard",
  "context": "3-4 sentences: who it affects, scale, why it exists",
  "tried_before": "What solutions have been attempted or why existing tools fail",
  "time_estimate": "e.g. 'Weekend MVP' or '2-4 weeks'",
  "tags": ["tag1", "tag2", "tag3"],
  "opportunity_score": 62-99 integer rating how good an opportunity this is for a builder (market pain × feasibility × competition gap),
  "solution_exists_score": integer 1-10 per the scale above,
  "gap_analysis": "If score 4-6: one sentence on what existing solutions miss, followed by a specific product idea that fills the gap. If score 1-3: empty string. If score 7-10: 'mature solution exists'"
}`;

export async function structureProblem(
  post: RawPost
): Promise<StructuredProblem | null> {
  const model = getModel();
  if (!model) {
    console.error("GEMINI_API_KEY is not configured");
    return null;
  }

  const sourceLabel =
    post.source === "reddit"
      ? `Reddit r/${post.subreddit ?? "unknown"}`
      : "Hacker News Ask HN";

  // Truncate very long bodies to keep token usage reasonable
  const body = (post.body || "(no body)").slice(0, 2000);

  try {
    const result = await model.generateContent([
      STRUCTURE_PROMPT,
      `\nSource: ${sourceLabel}\nTitle: ${post.title}\n\nBody:\n${body}`,
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as StructuredProblem;
  } catch (err) {
    const msg = String(err);
    if (msg.includes("429") || msg.includes("spending cap") || msg.includes("quota")) {
      throw new Error(`Gemini API limit hit (${msg.includes("spending cap") ? "monthly spending cap exceeded — go to ai.studio/spend to increase it" : "rate limited"})`);
    }
    console.error("Gemini structure error:", err);
    return null;
  }
}

const GENERIC_STACK = /general web|web development|your stack|modern stack|full.?stack|typical stack/i;

function stackCombo(stack: string[], index: number): string {
  const a = stack[index % stack.length];
  const b = stack[(index + 1) % stack.length];
  const c = stack[(index + 2) % stack.length];
  return c && c !== b ? `${a} + ${b} + ${c}` : `${a} + ${b}`;
}

function sanitizeIdeas(ideas: BuildIdea[], stack: string[]): BuildIdea[] {
  return ideas.map((idea, i) => {
    const combo = stackCombo(stack, i);
    let stackMatch = idea.stackMatch?.trim() ?? "";
    if (!stackMatch || GENERIC_STACK.test(stackMatch)) {
      stackMatch = combo;
    }

    let description = idea.description ?? "";
    description = description.replace(GENERIC_STACK, combo);
    for (const tech of stack.slice(0, 4)) {
      if (!description.includes(tech)) {
        description = description.replace(/\.$/, "") + ` Built with ${tech}.`;
        break;
      }
    }

    return { ...idea, stackMatch, description };
  });
}

export async function generateBuildIdeas(
  problem: {
    headline: string;
    context: string;
    tried_before: string;
    domain?: string;
  },
  stack: string[]
): Promise<{ ideas: BuildIdea[]; stackUsed: string[]; error?: string }> {
  if (stack.length === 0) {
    return { ideas: [], stackUsed: [], error: "Complete onboarding to set your stack" };
  }

  const stackUsed = stack;
  const stackStr = stackUsed.join(", ");
  const model = getModel();

  if (!model) {
    return { ideas: [], stackUsed, error: "GEMINI_API_KEY is not configured" };
  }

  const prompt = `You are a technical advisor for builders. The builder's EXACT tech stack is: ${stackStr}

You MUST reference specific technologies from their stack by name in every idea. Do NOT say "general web development" or use vague stack descriptions.

Problem headline: ${problem.headline}
Domain: ${problem.domain ?? "Unknown"}
Context: ${problem.context}
What's been tried: ${problem.tried_before}

Generate exactly 3 specific, actionable project ideas this builder could start THIS WEEKEND.

Rules:
- Each idea must name 2-3 specific technologies from their stack (${stackStr})
- stackMatch field must list the exact stack items used, e.g. "Next.js + Supabase + TypeScript"
- Ideas must be concrete products, not generic advice

Return ONLY valid JSON array:
[
  { "title": "Short project name", "description": "2-3 sentences — what to build, who it's for, why it fits their stack", "stackMatch": "Exact stack items e.g. React + Node.js + PostgreSQL" }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { ideas: [], stackUsed, error: "Gemini returned an invalid response" };
    }

    const ideas = sanitizeIdeas(JSON.parse(jsonMatch[0]) as BuildIdea[], stackUsed);
    return { ideas, stackUsed };
  } catch (err) {
    console.error("Gemini ideas error:", err);
    return { ideas: [], stackUsed, error: "Failed to generate build ideas" };
  }
}
