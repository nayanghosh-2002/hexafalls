import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/user-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      totalBuilders: 0,
      problemCount: 0,
      lastUpdated: null,
      configured: false,
    });
  }

  const stats = await getPlatformStats();

  return NextResponse.json({
    ...stats,
    configured: true,
  });
}
