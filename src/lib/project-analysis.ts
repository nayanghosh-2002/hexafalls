import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProjectAnalysis } from "./types";
import { STACK_OPTIONS, DOMAIN_OPTIONS } from "./constants";
import { DEFAULT_GEMINI_MODEL } from "./gemini";

const STACK_ALIASES: Record<string, string> = {
  javascript: "TypeScript",
  js: "TypeScript",
  ts: "TypeScript",
  node: "Node.js",
  "node.js": "Node.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  ml: "AI/ML",
  "machine learning": "AI/ML",
  flutter: "Flutter",
  golang: "Go",
};

function normalizeStackItem(value: string): string | null {
  const trimmed = value.trim();
  const direct = STACK_OPTIONS.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  if (direct) return direct;

  const alias = STACK_ALIASES[trimmed.toLowerCase()];
  if (alias && STACK_OPTIONS.includes(alias)) return alias;

  return null;
}

function normalizeDomainItem(value: string): string | null {
  const trimmed = value.trim();
  return DOMAIN_OPTIONS.find((d) => d.toLowerCase() === trimmed.toLowerCase()) ?? null;
}

// Capacity-only fallback (503/overloaded), distinct from the billing-cap
// fallback in gemini.ts — this model is never the default, only a backstop.
const FALLBACK_MODEL = "gemini-2.0-flash";

function makeModel(apiKey: string, modelName: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY ?? null;
}

function preferredModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function isCapacityError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("high demand") || msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE");
}

async function generateWithFallback(prompt: string, retries = 1): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const primary = preferredModel();
  try {
    const result = await makeModel(apiKey, primary).generateContent(prompt);
    const text = result.response.text();
    // Retry once if the model returns an empty response (cold start)
    if (!text?.trim() && retries > 0) {
      return generateWithFallback(prompt, retries - 1);
    }
    return text;
  } catch (err) {
    if (isCapacityError(err)) {
      console.warn(`${primary} capacity exceeded, falling back to ${FALLBACK_MODEL}`);
      try {
        const result = await makeModel(apiKey, FALLBACK_MODEL).generateContent(prompt);
        return result.response.text();
      } catch (fallbackErr) {
        console.error("Fallback model also failed:", fallbackErr);
        throw new Error(`Gemini unavailable: ${String(fallbackErr).slice(0, 120)}`);
      }
    }
    throw err;
  }
}

export async function analyzeProject(project: {
  name: string;
  description: string;
  language: string;
  topics: string[];
  readme: string;
}): Promise<{ analysis: ProjectAnalysis | null; error?: string }> {
  if (!getApiKey()) return { analysis: null, error: "GEMINI_API_KEY is not set" };

  const prompt = `You are a product analyst evaluating a developer's GitHub project. Give an honest, specific, encouraging assessment.

Project: ${project.name}
Description: ${project.description || "No description provided"}
Primary language: ${project.language || "Unknown"}
Topics/tags: ${project.topics.join(", ") || "None"}
README (first 4000 chars):
${project.readme || "No README found"}

Analyze this project and return ONLY valid JSON matching this exact shape:
{
  "completeness_score": integer 0-100 (0=empty skeleton, 50=working but rough, 80=polished with docs, 100=production-ready with CI/tests/docs),
  "verdict": "One honest sentence summarising the project's current state and readiness",
  "problem_solved": "2-3 sentences: what specific problem this solves and who benefits",
  "improvements": ["4-6 specific, actionable things to add or improve — be concrete, not generic"],
  "competitors": [
    {"name": "ProductName", "url": "https://example.com", "how_different": "One sentence: how this project differs from or beats this competitor"}
  ],
  "gaps_vs_competitors": "2 sentences: what unique angle or advantage this project has that competitors lack",
  "estimated_users": "Specific realistic range e.g. '8,000–30,000 developers' with a one-sentence reason",
  "bo_message": "2-3 sentences from Bo, a friendly mascot. Reference the specific project name and user estimate. Be genuinely encouraging but grounded. End with one actionable next step."
}`;

  try {
    const text = await generateWithFallback(prompt);
    if (!text) return { analysis: null, error: "No response from Gemini" };
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { analysis: null, error: "Gemini returned no JSON" };
    return { analysis: JSON.parse(jsonMatch[0]) as ProjectAnalysis };
  } catch (err) {
    const msg = String(err);
    const friendly = msg.includes("high demand") || msg.includes("UNAVAILABLE")
      ? "Gemini is overloaded right now — please try again in a minute"
      : msg.includes("quota") || msg.includes("429")
      ? "Gemini rate limit hit — try again shortly"
      : "Analysis failed — please try again";
    console.error("analyzeProject error:", err);
    return { analysis: null, error: friendly };
  }
}

export async function extractProfileFromLinks(
  links: string[],
  repoSummary: string,
  portfolioText?: string
): Promise<{
  stack: string[];
  domains: string[];
  certifications: string[];
  experience: string;
  education: string;
}> {
  const empty = { stack: [], domains: [], certifications: [], experience: "", education: "" };
  if (!getApiKey()) return empty;

  const prompt = `You are extracting a developer's professional profile from their online presence.

Links: ${links.join(", ")}
${repoSummary ? `GitHub repos: ${repoSummary}` : ""}
${portfolioText ? `Portfolio/website content:\n${portfolioText.slice(0, 3000)}` : ""}

Extract the following. Use ONLY what you can confidently determine from the context above.

Available stack options: ${STACK_OPTIONS.join(", ")}
Available domain options: ${DOMAIN_OPTIONS.join(", ")}

Return ONLY valid JSON:
{
  "stack": ["technology names from the available list only"],
  "domains": ["domain names from the available list only"],
  "certifications": ["list any professional certifications mentioned — empty array if none found"],
  "experience": "Brief summary of work/professional experience in 1-3 sentences. Empty string if not found.",
  "education": "Educational background in 1-2 sentences. Empty string if not found."
}`;

  try {
    const text = await generateWithFallback(prompt);
    if (!text) return empty;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return empty;
    const parsed = JSON.parse(jsonMatch[0]) as {
      stack?: string[];
      domains?: string[];
      certifications?: string[];
      experience?: string;
      education?: string;
    };
    return {
      stack: (parsed.stack ?? [])
        .map((s) => normalizeStackItem(s))
        .filter((s): s is string => Boolean(s)),
      domains: (parsed.domains ?? [])
        .map((d) => normalizeDomainItem(d))
        .filter((d): d is string => Boolean(d)),
      certifications: parsed.certifications ?? [],
      experience: parsed.experience ?? "",
      education: parsed.education ?? "",
    };
  } catch {
    return empty;
  }
}
