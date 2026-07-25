import axios from "axios";
import type { Problem } from "./types";

export interface RelatedPost {
  title: string;
  url: string;
  source: "reddit" | "hn";
  postedAt: string;
  excerpt: string;
}

export interface RelatedIssue {
  title: string;
  repo: string;
  url: string;
  state: string;
  comments: number;
}

export interface BuildingActivity {
  relatedPosts: RelatedPost[];
  githubIssues: RelatedIssue[];
  complaintsToday: number;
  complaintsSinceStarted: number;
}

const USER_AGENT = "Sealit/1.0 (hackathon project)";

function extractKeywords(headline: string): string {
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "must", "shall", "can", "need",
    "not", "no", "can't", "don't", "doesn't", "won't", "it's", "they",
    "them", "their", "this", "that", "these", "those", "who", "what",
    "when", "where", "why", "how", "all", "each", "every", "both", "few",
    "more", "most", "other", "some", "such", "than", "too", "very", "just",
  ]);

  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w))
    .slice(0, 4)
    .join(" ");
}

function excerpt(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

async function searchReddit(query: string, since: Date): Promise<RelatedPost[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=15`;
    const { data } = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 12000,
    });

    const posts: RelatedPost[] = [];
    for (const child of data?.data?.children ?? []) {
      const post = child.data;
      if (!post?.title) continue;

      const created = new Date((post.created_utc as number) * 1000);
      if (created < since) continue;

      posts.push({
        title: post.title as string,
        url: `https://reddit.com${post.permalink as string}`,
        source: "reddit",
        postedAt: created.toISOString(),
        excerpt: excerpt((post.selftext as string) || post.title),
      });
    }

    return posts;
  } catch (err) {
    console.error("Reddit search error:", err);
    return [];
  }
}

async function searchHackerNews(query: string, since: Date): Promise<RelatedPost[]> {
  try {
    const sinceTs = Math.floor(since.getTime() / 1000);
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${sinceTs}&hitsPerPage=15`;
    const { data } = await axios.get(url, { timeout: 12000 });

    return (data.hits ?? []).map((hit: {
      title: string;
      url?: string;
      objectID: string;
      created_at_i: number;
      story_text?: string;
    }) => ({
      title: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "hn" as const,
      postedAt: new Date(hit.created_at_i * 1000).toISOString(),
      excerpt: excerpt(hit.story_text || hit.title),
    }));
  } catch (err) {
    console.error("HN search error:", err);
    return [];
  }
}

async function searchGitHub(query: string): Promise<RelatedIssue[]> {
  try {
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}+is:issue+is:open&sort=updated&per_page=6`;
    const { data } = await axios.get(url, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": USER_AGENT },
      timeout: 10000,
    });

    return (data.items ?? []).slice(0, 6).map((item: {
      title: string;
      html_url: string;
      repository_url: string;
      state: string;
      comments: number;
    }) => ({
      title: item.title,
      repo: item.repository_url.split("/").slice(-2).join("/"),
      url: item.html_url,
      state: item.state,
      comments: item.comments,
    }));
  } catch (err) {
    console.error("GitHub search error:", err);
    return [];
  }
}

export async function fetchBuildingActivity(
  problem: Problem,
  startedAt: string
): Promise<BuildingActivity> {
  const since = new Date(startedAt);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const query = extractKeywords(problem.headline) || problem.domain;

  const [redditPosts, hnPosts, githubIssues] = await Promise.all([
    searchReddit(query, since),
    searchHackerNews(query, since),
    searchGitHub(query),
  ]);

  const relatedPosts = [...redditPosts, ...hnPosts].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  const complaintsSinceStarted = relatedPosts.length;
  const complaintsToday = relatedPosts.filter(
    (p) => new Date(p.postedAt) >= todayStart
  ).length;

  return {
    relatedPosts,
    githubIssues,
    complaintsToday,
    complaintsSinceStarted,
  };
}
