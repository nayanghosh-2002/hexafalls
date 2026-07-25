import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  const ready =
    hasGemini &&
    hasSupabaseUrl &&
    (hasAnonKey || hasServiceRole) &&
    hasServiceRole;

  const missing: string[] = [];
  if (!hasSupabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!hasAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!hasServiceRole) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY (required to save scraped problems)");
  }
  if (!hasGemini) missing.push("GEMINI_API_KEY");

  return NextResponse.json({
    ready,
    supabase: isSupabaseConfigured(),
    hasGemini,
    hasServiceRole,
    geminiModel: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    missing,
  });
}
