import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { POST_SIGNUP_PATH } from "@/lib/auth-paths";

const PROTECTED = ["/feed", "/building", "/saved", "/profile", "/project", "/problem"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];
const ONBOARDING_PATH = POST_SIGNUP_PATH;

async function needsOnboarding(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_profiles")
    .select("completed")
    .eq("user_id", userId)
    .maybeSingle();

  return !data?.completed;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isOnboarding = pathname.startsWith(ONBOARDING_PATH);

  // Unauthenticated user hitting a protected page → send to login
  if (!user && (isProtected || isOnboarding)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const incomplete = await needsOnboarding(supabase, user.id);

    // Authenticated but onboarding incomplete → force onboarding
    if (incomplete && isProtected) {
      return NextResponse.redirect(new URL(ONBOARDING_PATH, request.url));
    }

    // Onboarding already done → skip onboarding page
    if (!incomplete && isOnboarding) {
      return NextResponse.redirect(new URL("/feed", request.url));
    }

    // Authenticated user hitting an auth page → send to the right destination
    if (isAuthPage) {
      return NextResponse.redirect(
        new URL(incomplete ? ONBOARDING_PATH : "/feed", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
