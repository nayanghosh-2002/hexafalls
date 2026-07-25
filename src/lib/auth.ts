"use client";

import { POST_LOGIN_PATH, POST_SIGNUP_PATH } from "./auth-paths";
import { getSupabaseBrowser } from "./supabase-browser";

export { POST_LOGIN_PATH, POST_SIGNUP_PATH } from "./auth-paths";

function requireSupabase() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("Supabase is not configured. Check your .env.local file.");
  }
  return supabase;
}

export async function signInWithProvider(
  provider: "google" | "github",
  intent: "login" | "signup" = "login"
) {
  const supabase = requireSupabase();
  const next = intent === "signup" ? POST_SIGNUP_PATH : POST_LOGIN_PATH;
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = requireSupabase();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = requireSupabase();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(POST_SIGNUP_PATH)}`,
    },
  });

  if (error) throw error;

  return { needsConfirmation: !data.session };
}

export async function resetPasswordForEmail(email: string) {
  const supabase = requireSupabase();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw error;
}

export async function updatePassword(password: string) {
  const supabase = requireSupabase();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    await supabase.auth.signOut();
  }
}
