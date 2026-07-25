import { NextResponse } from "next/server";
import { POST_LOGIN_PATH, POST_SIGNUP_PATH } from "@/lib/auth-paths";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const isSignupIntent = nextParam === POST_SIGNUP_PATH;
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("No authorization code received.")}`
    );
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Supabase is not configured.")}`
    );
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // If this was a login attempt (not signup), check if a new account was just created.
  // Supabase creates accounts automatically on OAuth — we block that on the login flow.
  if (!isSignupIntent && data.user) {
    const createdAt = new Date(data.user.created_at).getTime();
    const isNewAccount = Date.now() - createdAt < 60_000;

    if (isNewAccount) {
      // Sign them out — they have no existing account
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "No account found for that Google account. Please sign up first."
        )}`
      );
    }
  }

  const next = isSignupIntent ? POST_SIGNUP_PATH : POST_LOGIN_PATH;
  return NextResponse.redirect(new URL(next, origin));
}
