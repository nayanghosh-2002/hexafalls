"use client";

import { getSupabaseBrowser } from "./supabase-browser";
import type { BuildStage, OnboardingProfile, UserProject } from "./types";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { "Content-Type": "application/json" };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error("Supabase is not configured");

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchUserProfile(): Promise<OnboardingProfile | null> {
  try {
    const res = await authFetch("/api/user/profile");
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile ?? null;
  } catch {
    return null;
  }
}

export async function resolvePostAuthPath(): Promise<string> {
  const profile = await fetchUserProfile();
  return profile?.completed ? "/feed" : "/onboarding";
}

export async function saveUserProfile(profile: OnboardingProfile): Promise<boolean> {
  const res = await authFetch("/api/user/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  return res.ok;
}

export async function fetchSavedProblems(): Promise<{ id: string; savedAt: string }[]> {
  try {
    const res = await authFetch("/api/user/saved");
    if (!res.ok) return [];
    const data = await res.json();
    return data.saved ?? [];
  } catch {
    return [];
  }
}

export async function saveProblemRemote(id: string): Promise<boolean> {
  const res = await authFetch("/api/user/saved", {
    method: "POST",
    body: JSON.stringify({ problemId: id }),
  });
  return res.ok;
}

export async function unsaveProblemRemote(id: string): Promise<boolean> {
  const res = await authFetch(`/api/user/saved?problemId=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function fetchBuildingProjects(): Promise<
  { id: string; startedAt: string; stage: BuildStage }[]
> {
  try {
    const res = await authFetch("/api/user/building");
    if (!res.ok) return [];
    const data = await res.json();
    return data.building ?? [];
  } catch {
    return [];
  }
}

export async function startBuildingRemote(
  id: string
): Promise<{ startedAt: string; stage: BuildStage } | null> {
  const res = await authFetch("/api/user/building", {
    method: "POST",
    body: JSON.stringify({ problemId: id }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.building ?? null;
}

export async function updateBuildingStageRemote(id: string, stage: BuildStage): Promise<boolean> {
  const res = await authFetch("/api/user/building", {
    method: "PATCH",
    body: JSON.stringify({ problemId: id, stage }),
  });
  return res.ok;
}

export async function fetchUserProjects(): Promise<UserProject[]> {
  try {
    const res = await authFetch("/api/user/projects");
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects ?? [];
  } catch {
    return [];
  }
}

export async function syncGitHubProjects(githubUsername: string): Promise<UserProject[]> {
  try {
    const res = await authFetch("/api/user/projects", {
      method: "POST",
      body: JSON.stringify({ github_username: githubUsername }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects ?? [];
  } catch {
    return [];
  }
}

export async function authFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await authFetch(url, options);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function analyzeLinks(links: string[]): Promise<{
  stack: string[];
  domains: string[];
  github_username: string | null;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  website: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  links: string[];
  certifications: string[];
  experience: string;
  education: string;
} | null> {
  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch("/api/profile/analyze-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ links }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
