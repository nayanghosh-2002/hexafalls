"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { STACK_OPTIONS, DOMAIN_OPTIONS, GOAL_OPTIONS } from "@/lib/constants";
import { signOut } from "@/lib/auth";
import { fetchUserProfile, saveUserProfile, fetchUserProjects, analyzeLinks, getAuthHeaders } from "@/lib/user-client";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { OnboardingProfile, UserProject } from "@/lib/types";

const GHIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.72-4.03-1.42-4.03-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.19.7.8.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
  </svg>
);
const LIIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.27V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
);
const WebIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const PinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

function Avatar({ url, name, size = 80 }: { url?: string; name?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const init = (name ?? "B").charAt(0).toUpperCase();
  const palette = ["bg-violet-500", "bg-primary", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
  const bg = palette[init.charCodeAt(0) % palette.length];
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} width={size} height={size}
        className="rounded-full object-cover ring-[3px] ring-border"
        style={{ width: size, height: size, minWidth: size }}
        onError={() => setErr(true)} />
    );
  }
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full ${bg} font-bold text-white ring-[3px] ring-border`}
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.38 }}>
      {init}
    </div>
  );
}

const LANG_DOT: Record<string, string> = {
  TypeScript: "bg-blue-500", JavaScript: "bg-yellow-400", Python: "bg-green-500",
  Swift: "bg-orange-400", Go: "bg-cyan-500", Rust: "bg-orange-500",
  "C++": "bg-purple-400", Java: "bg-red-400", Kotlin: "bg-violet-500", HTML: "bg-red-300",
};

function ProjectCard({ p }: { p: UserProject }) {
  const dot = LANG_DOT[p.language ?? ""] ?? "bg-gray-400";
  const score = p.analysis?.completeness_score;
  const scoreColor = score == null ? null : score >= 70 ? "text-emerald-600 bg-emerald-50" : score >= 40 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  return (
    <Link href={`/project/${p.github_username}/${p.repo_name}`}
      className="group flex flex-col gap-2.5 rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:bg-surface-subtle hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-semibold text-foreground group-hover:text-primary truncate leading-tight transition-colors">{p.repo_name}</span>
        {score != null ? (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreColor}`}>{score}</span>
        ) : p.stars > 0 ? (
          <span className="flex shrink-0 items-center gap-1 text-[12px] text-muted ml-1">
            <StarIcon />{p.stars}
          </span>
        ) : null}
      </div>
      {p.description && <p className="text-[13px] text-muted line-clamp-2 leading-relaxed">{p.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-0.5">
        {p.language && (
          <span className="flex items-center gap-1.5 text-[12px] text-muted">
            <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />{p.language}
          </span>
        )}
        {p.topics?.slice(0, 2).map((t) => (
          <span key={t} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-muted">{t}</span>
        ))}
      </div>
    </Link>
  );
}

type EditForm = {
  display_name: string; age: string; bio: string; location: string;
  avatar_url: string; website: string; linkedin_url: string; github_username: string;
  certifications: string; experience: string; education: string;
  stack: string[]; domains: string[];
};

function toForm(p: OnboardingProfile | null, u: User | null): EditForm {
  return {
    display_name: p?.display_name ?? u?.user_metadata?.full_name ?? u?.user_metadata?.name ?? "",
    age: p?.age != null ? String(p.age) : "",
    bio: p?.bio ?? "",
    location: p?.location ?? "",
    avatar_url: p?.avatar_url ?? u?.user_metadata?.avatar_url ?? "",
    website: p?.website ?? "",
    linkedin_url: p?.linkedin_url ?? "",
    github_username: p?.github_username ?? "",
    certifications: (p?.certifications ?? []).join("\n"),
    experience: p?.experience ?? "",
    education: p?.education ?? "",
    stack: p?.stack ?? [],
    domains: p?.domains ?? [],
  };
}

function mergeAnalyzeResult(
  base: OnboardingProfile,
  result: NonNullable<Awaited<ReturnType<typeof analyzeLinks>>>
): OnboardingProfile {
  return {
    ...base,
    stack: result.stack.length > 0 ? result.stack : base.stack,
    domains: result.domains.length > 0 ? result.domains : base.domains,
    display_name: base.display_name ?? result.display_name ?? undefined,
    bio: base.bio ?? result.bio ?? undefined,
    location: base.location ?? result.location ?? undefined,
    avatar_url: base.avatar_url ?? result.avatar_url ?? undefined,
    website: base.website ?? result.website ?? undefined,
    linkedin_url: base.linkedin_url ?? result.linkedin_url ?? undefined,
    portfolio_url: base.portfolio_url ?? result.portfolio_url ?? undefined,
    links: result.links.length > 0 ? result.links : base.links,
    github_username: base.github_username ?? result.github_username ?? undefined,
    certifications: base.certifications ?? (result.certifications.length > 0 ? result.certifications : undefined),
    experience: base.experience ?? (result.experience || undefined),
    education: base.education ?? (result.education || undefined),
  };
}

function formatLinkLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

const inp = "w-full rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20";
const ta = `${inp} resize-none`;
const lbl = "mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(toForm(null, null));
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [detectingStack, setDetectingStack] = useState(false);
  const [bulkAnalysing, setBulkAnalysing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const autoDetectRan = useRef(false);
  const { theme } = useTheme();

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser();
      const [{ data: ud }, prof, projs] = await Promise.all([
        supabase?.auth.getUser() ?? Promise.resolve({ data: { user: null } }),
        fetchUserProfile(),
        fetchUserProjects(),
      ]);
      const u = ud?.user ?? null;
      setUser(u);
      setProfile(prof);
      setProjects(projs);
      setForm(toForm(prof, u));

      if (!autoDetectRan.current && prof && prof.stack.length === 0 && prof.github_username) {
        autoDetectRan.current = true;
        setDetectingStack(true);
        try {
          const result = await analyzeLinks([`https://github.com/${prof.github_username}`]);
          if (result && (result.stack.length > 0 || result.domains.length > 0 || result.linkedin_url || result.portfolio_url)) {
            const updated = mergeAnalyzeResult(prof, result);
            await saveUserProfile(updated);
            setProfile(updated);
            setForm(toForm(updated, u));
          }
        } catch { /* silent */ }
        setDetectingStack(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const newGitHubUsername = form.github_username.trim() || undefined;
      const updated: OnboardingProfile = {
        stack: form.stack, domains: form.domains,
        goal: profile?.goal ?? "side_project",
        completed: profile?.completed ?? true,
        github_username: newGitHubUsername,
        display_name: form.display_name || undefined,
        age: form.age ? parseInt(form.age, 10) : undefined,
        bio: form.bio || undefined, location: form.location || undefined,
        avatar_url: form.avatar_url || undefined, website: form.website || undefined,
        linkedin_url: form.linkedin_url.trim() || profile?.linkedin_url,
        portfolio_url: profile?.portfolio_url,
        links: profile?.links,
        certifications: form.certifications
          ? form.certifications.split("\n").map((s) => s.trim()).filter(Boolean)
          : undefined,
        experience: form.experience || undefined, education: form.education || undefined,
      };
      await saveUserProfile(updated);
      setProfile(updated);
      setEditing(false);

      // Auto-detect stack if github username was just added and stack is still empty
      if (newGitHubUsername && form.stack.length === 0 && !autoDetectRan.current) {
        autoDetectRan.current = true;
        setDetectingStack(true);
        try {
          const result = await analyzeLinks([`https://github.com/${newGitHubUsername}`]);
          if (result && (result.stack.length > 0 || result.domains.length > 0 || result.linkedin_url || result.portfolio_url)) {
            const withStack = mergeAnalyzeResult(updated, result);
            await saveUserProfile(withStack);
            setProfile(withStack);
            setForm((f) => ({ ...f, stack: withStack.stack, domains: withStack.domains }));
          }
        } catch { /* silent */ }
        setDetectingStack(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyseAll() {
    const unanalysed = projects.filter((p) => !p.analysis);
    if (unanalysed.length === 0) return;
    setBulkAnalysing(true);
    setBulkProgress({ done: 0, total: unanalysed.length });
    const headers = await getAuthHeaders();
    const updatedProjects = [...projects];
    for (let i = 0; i < unanalysed.length; i++) {
      const p = unanalysed[i];
      try {
        const res = await fetch(`/api/project/${p.github_username}/${p.repo_name}`, {
          method: "POST",
          headers,
        });
        const data = await res.json();
        if (data.analysis) {
          const idx = updatedProjects.findIndex((x) => x.id === p.id);
          if (idx !== -1) updatedProjects[idx] = { ...updatedProjects[idx], analysis: data.analysis };
          setProjects([...updatedProjects]);
        }
      } catch {}
      setBulkProgress({ done: i + 1, total: unanalysed.length });
    }
    setBulkAnalysing(false);
    setBulkProgress(null);
  }

  const displayName = profile?.display_name ?? user?.user_metadata?.full_name ??
    user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "Builder";
  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url;
  const goalLabel = GOAL_OPTIONS.find((g) => g.id === profile?.goal)?.label;

  const extLinks: { href: string; icon: React.ReactNode; label: string }[] = [];
  const seenLinks = new Set<string>();

  function addLink(href: string, icon: React.ReactNode, label: string) {
    if (!href || seenLinks.has(href)) return;
    seenLinks.add(href);
    extLinks.push({ href, icon, label });
  }

  if (profile?.github_username)
    addLink(`https://github.com/${profile.github_username}`, <GHIcon />, "GitHub");
  if (profile?.linkedin_url)
    addLink(profile.linkedin_url, <LIIcon />, "LinkedIn");
  if (profile?.website)
    addLink(profile.website, <WebIcon />, formatLinkLabel(profile.website));
  else if (profile?.portfolio_url)
    addLink(profile.portfolio_url, <WebIcon />, formatLinkLabel(profile.portfolio_url));

  for (const url of profile?.links ?? []) {
    if (url.includes("github.com") || url.includes("linkedin.com")) continue;
    addLink(url, <WebIcon />, formatLinkLabel(url));
  }

  const hasCerts = (profile?.certifications ?? []).length > 0;
  const hasExp = !!profile?.experience;
  const hasEdu = !!profile?.education;

  return (
    <div className="flex h-full gap-0">

        {/* ── LEFT PANEL ── */}
        <aside className="flex w-[300px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-border p-5 xl:w-[340px]">

          {/* Identity */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            {editing ? (
              <div className="space-y-4">
                <div className="flex justify-center pb-1">
                  <Avatar url={form.avatar_url || undefined} name={form.display_name || displayName} size={72} />
                </div>
                <div>
                  <label className={lbl}>Avatar URL</label>
                  <input type="url" value={form.avatar_url} onChange={(e) => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Name</label>
                    <input type="text" value={form.display_name} onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Your name" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Age</label>
                    <input type="number" value={form.age} onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))} placeholder="25" min={10} max={100} className={inp} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Bio</label>
                  <textarea rows={3} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="What you build..." className={ta} />
                </div>
                <div>
                  <label className={lbl}>Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Website</label>
                  <input type="url" value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className={inp} />
                </div>
                <div>
                  <label className={lbl}>LinkedIn URL</label>
                  <input type="url" value={form.linkedin_url} onChange={(e) => setForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/..." className={inp} />
                </div>
                <div>
                  <label className={lbl}>GitHub Username</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={form.github_username} onChange={(e) => setForm(f => ({ ...f, github_username: e.target.value.replace(/^@/, "").trim() }))} placeholder="yourusername" className={`${inp} flex-1`} />
                  </div>
                  {form.github_username && form.stack.length === 0 && (
                    <p className="mt-1 text-[11px] text-primary">Stack will be auto-detected on save</p>
                  )}
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-border py-2.5 text-[13px] font-medium text-muted hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50">
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <Avatar url={avatarUrl} name={displayName} size={80} />
                  <button onClick={() => { setForm(toForm(profile, user)); setEditing(true); }}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted hover:border-primary/30 hover:text-foreground transition-colors">
                    <EditIcon /> Edit
                  </button>
                </div>

                <div>
                  <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
                    {displayName}
                    {profile?.age ? <span className="ml-2 text-[16px] font-normal text-muted">{profile.age}</span> : null}
                  </h1>
                  {user?.email && <p className="mt-0.5 text-[13px] text-muted">{user.email}</p>}
                </div>

                {profile?.bio && (
                  <p className="text-[14px] leading-relaxed text-foreground/75">{profile.bio}</p>
                )}

                <div className="flex flex-col gap-1.5 text-[13px] text-muted">
                  {profile?.location && (
                    <span className="flex items-center gap-2"><PinIcon />{profile.location}</span>
                  )}
                  {profile?.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-foreground transition-colors">
                      <WebIcon />{profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                </div>

                {extLinks.length > 0 && (
                  <div className="flex flex-col gap-2 pt-1">
                    {extLinks.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 text-[13px] font-medium text-muted hover:border-primary/30 hover:text-foreground transition-colors">
                        {l.icon}{l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Goal */}
          {goalLabel && (
            <div className="rounded-2xl border border-border bg-surface px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Builder Goal</p>
              <p className="mt-1.5 text-[15px] font-semibold text-foreground">{goalLabel}</p>
            </div>
          )}

          {/* Extras */}
          {(editing || hasCerts || hasExp || hasEdu) && (
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
              {(editing || hasCerts) && (
                <div>
                  <p className={lbl}>Certifications</p>
                  {editing ? (
                    <textarea rows={3} value={form.certifications}
                      onChange={(e) => setForm(f => ({ ...f, certifications: e.target.value }))}
                      placeholder={"AWS Solutions Architect\nGoogle Cloud Professional"} className={ta} />
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {profile?.certifications?.map((c) => (
                        <li key={c} className="flex items-center gap-2.5 text-[13px] text-foreground">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{c}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {(hasCerts || editing) && (hasExp || editing) && <div className="border-t border-border" />}
              {(editing || hasExp) && (
                <div>
                  <p className={lbl}>Experience</p>
                  {editing ? (
                    <textarea rows={3} value={form.experience}
                      onChange={(e) => setForm(f => ({ ...f, experience: e.target.value }))}
                      placeholder="Work experience…" className={ta} />
                  ) : (
                    <p className="mt-2 text-[13px] leading-relaxed text-foreground/80 whitespace-pre-line">{profile?.experience}</p>
                  )}
                </div>
              )}
              {(hasExp || editing) && (hasEdu || editing) && <div className="border-t border-border" />}
              {(editing || hasEdu) && (
                <div>
                  <p className={lbl}>Education</p>
                  {editing ? (
                    <textarea rows={2} value={form.education}
                      onChange={(e) => setForm(f => ({ ...f, education: e.target.value }))}
                      placeholder="B.S. Computer Science…" className={ta} />
                  ) : (
                    <p className="mt-2 text-[13px] leading-relaxed text-foreground/80 whitespace-pre-line">{profile?.education}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div className="mt-auto rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-[14px] font-semibold text-foreground">Appearance</p>
                <p className="text-[12px] text-muted">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="border-t border-border" />
            <button type="button"
              onClick={async () => { setLoggingOut(true); await signOut(); router.push("/login"); }}
              disabled={loggingOut}
              className="w-full px-5 py-4 text-left text-[14px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60">
              {loggingOut ? "Signing out…" : "Log out"}
            </button>
          </div>

        </aside>

        {/* ── RIGHT PANEL ── */}
        <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-5">

          {/* Stack + Domains */}
          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted">Tech Stack</p>
                {detectingStack && <span className="text-[11px] text-muted animate-pulse">Detecting from GitHub…</span>}
              </div>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {STACK_OPTIONS.map((s) => {
                    const on = form.stack.includes(s);
                    return (
                      <button key={s} onClick={() => setForm(f => ({ ...f, stack: on ? f.stack.filter(x => x !== s) : [...f.stack, s] }))}
                        className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-all ${on ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary/40 hover:text-foreground"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              ) : profile?.stack && profile.stack.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.stack.map((s) => (
                    <span key={s} className="rounded-lg bg-surface-muted px-3.5 py-1.5 text-[13px] font-medium text-foreground">{s}</span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {detectingStack ? (
                    <p className="text-[13px] text-muted animate-pulse">Reading your GitHub repos…</p>
                  ) : (
                    <>
                      <button onClick={() => { setForm(toForm(profile, user)); setEditing(true); }} className="text-[13px] text-primary hover:underline">Add your stack</button>
                      {profile?.github_username && (
                        <button
                          onClick={async () => {
                            setDetectingStack(true);
                            try {
                              const result = await analyzeLinks([`https://github.com/${profile.github_username}`]);
                              if (result && (result.stack.length > 0 || result.domains.length > 0)) {
                                const withStack = mergeAnalyzeResult(profile, result);
                                await saveUserProfile(withStack);
                                setProfile(withStack);
                                setForm(toForm(withStack, user));
                              }
                            } catch { /* silent */ }
                            setDetectingStack(false);
                          }}
                          className="text-[13px] text-muted hover:text-foreground hover:underline"
                        >
                          Re-detect from GitHub
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-muted">Focus Areas</p>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map((d) => {
                    const on = form.domains.includes(d);
                    return (
                      <button key={d} onClick={() => setForm(f => ({ ...f, domains: on ? f.domains.filter(x => x !== d) : [...f.domains, d] }))}
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${on ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary/40 hover:text-foreground"}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              ) : profile?.domains && profile.domains.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.domains.map((d) => (
                    <span key={d} className="rounded-full border border-primary/20 bg-primary-light px-3.5 py-1.5 text-[13px] font-medium text-primary">{d}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted">
                  <button onClick={() => { setForm(toForm(profile, user)); setEditing(true); }} className="text-primary hover:underline">Add focus areas</button>
                </p>
              )}
            </div>
          </div>

          {/* Projects */}
          {projects.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-muted">Projects</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {projects.filter((p) => p.analysis).length}/{projects.length} analysed
                  </p>
                </div>
                {projects.some((p) => !p.analysis) && (
                  <button
                    onClick={handleAnalyseAll}
                    disabled={bulkAnalysing}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {bulkAnalysing && bulkProgress ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white border-t-transparent" />
                        {bulkProgress.done}/{bulkProgress.total}
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        Analyse all
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
              </div>
            </div>
          )}

        </main>
      </div>
  );
}
