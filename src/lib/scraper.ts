import axios from "axios";
import * as cheerio from "cheerio";
import type { RawPost } from "./types";

const USER_AGENT = "Mozilla/5.0 (compatible; SealitBot/1.0; +https://sealit.dev)";

// 6 subreddits × REDDIT_PER_SUB posts each per run
const SUBREDDITS = [
  "SomebodyMakeThis",
  "startups",
  "entrepreneur",
  "nocode",
  "SideProject",
  "webdev",
];
const REDDIT_PER_SUB = 12;

// Algolia HN Search API — targeted "I wish this existed" type queries
// POSTS_PER_HN_QUERY posts each; runs every cron tick and accumulates in DB
const HN_ALGOLIA_QUERIES = [
  "wish someone would build",
  "looking for a tool that",
  "does anyone know of a tool",
  "Why doesnt this exist",
  "What do you wish existed",
  "no good solution",
  "has this been built",
  "problems that need solving",
];
const POSTS_PER_HN_QUERY = 8;

type PullPushSubmission = {
  title?: string;
  selftext?: string;
  permalink?: string;
  url?: string;
  stickied?: boolean;
  removed_by_category?: string | null;
};

type AlgoliaHit = {
  objectID: string;
  title?: string;
  story_text?: string | null;
};

function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  return $.text().trim();
}

async function scrapeRedditViaPullPush(subreddit: string, limit = 25): Promise<RawPost[]> {
  const { data } = await axios.get<{ data?: PullPushSubmission[] }>(
    "https://api.pullpush.io/reddit/search/submission/",
    {
      params: { subreddit, size: limit, sort: "desc", sort_type: "created_utc" },
      timeout: 20000,
    }
  );

  const posts: RawPost[] = [];
  for (const post of data?.data ?? []) {
    if (!post.title || post.stickied || post.removed_by_category) continue;
    const permalink = post.permalink?.startsWith("http")
      ? post.permalink
      : post.permalink
        ? `https://www.reddit.com${post.permalink}`
        : post.url ?? "";
    if (!permalink) continue;
    posts.push({ title: post.title, body: post.selftext || "", url: permalink, source: "reddit", subreddit });
  }
  return posts;
}

async function scrapeReddit(subreddit: string, limit = 25): Promise<{ posts: RawPost[]; warning?: string }> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
    const { data } = await axios.get(url, { headers: { "User-Agent": USER_AGENT }, timeout: 15000 });
    const posts: RawPost[] = [];
    for (const child of data?.data?.children ?? []) {
      const post = child.data;
      if (!post?.title || post.stickied) continue;
      posts.push({ title: post.title, body: post.selftext || "", url: `https://reddit.com${post.permalink}`, source: "reddit", subreddit });
    }
    if (posts.length > 0) return { posts };
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    console.warn(`Reddit API blocked for r/${subreddit}${status ? ` (${status})` : ""}, using archive fallback`);
  }

  try {
    const posts = await scrapeRedditViaPullPush(subreddit, limit);
    if (posts.length > 0) return { posts, warning: `Reddit blocked r/${subreddit}; used archive feed.` };
  } catch (err) {
    console.error(`Reddit archive fallback failed (${subreddit}):`, err);
  }

  return { posts: [], warning: `Could not fetch r/${subreddit} from Reddit or archive.` };
}

async function scrapeHNAlgolia(query: string, limit = 15): Promise<RawPost[]> {
  try {
    const { data } = await axios.get<{ hits: AlgoliaHit[] }>(
      "https://hn.algolia.com/api/v1/search",
      {
        params: { query, tags: "ask_hn", hitsPerPage: limit },
        timeout: 10000,
      }
    );
    return (data.hits ?? []).map((hit) => ({
      title: hit.title ?? "",
      body: hit.story_text ? stripHtml(hit.story_text) : "",
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "hn" as const,
    })).filter((p) => p.title);
  } catch {
    return [];
  }
}

async function scrapeAskHN(limit = 30): Promise<RawPost[]> {
  try {
    const { data: storyIds } = await axios.get<number[]>(
      "https://hacker-news.firebaseio.com/v0/askstories.json",
      { timeout: 15000 }
    );
    const posts: RawPost[] = [];
    const ids = (storyIds ?? []).slice(0, limit * 2);
    for (const id of ids) {
      if (posts.length >= limit) break;
      try {
        const { data: item } = await axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { timeout: 10000 }
        );
        if (!item?.title) continue;
        posts.push({
          title: item.title,
          body: item.text ? stripHtml(item.text) : "",
          url: `https://news.ycombinator.com/item?id=${id}`,
          source: "hn",
        });
      } catch {
        continue;
      }
    }
    return posts;
  } catch (err) {
    console.error("HN scrape error:", err);
    return [];
  }
}

export async function scrapeAllSources(): Promise<{
  posts: RawPost[];
  warnings: string[];
  sources: { reddit: number; hn: number };
}> {
  // Run all Reddit subreddits in parallel
  const redditResults = await Promise.all(
    SUBREDDITS.map((sub) => scrapeReddit(sub, REDDIT_PER_SUB))
  );

  const warnings: string[] = redditResults.flatMap((r) => (r.warning ? [r.warning] : []));
  const redditPosts = redditResults.flatMap((r) => r.posts);

  // Run HN Algolia queries in parallel (dedupe by URL)
  const [algoliaBatches, hnFirebasePosts] = await Promise.all([
    Promise.all(HN_ALGOLIA_QUERIES.map((q) => scrapeHNAlgolia(q, POSTS_PER_HN_QUERY))),
    scrapeAskHN(20),
  ]);

  const seenUrls = new Set<string>();
  const hnPosts: RawPost[] = [];

  // Add firebase posts first
  for (const p of hnFirebasePosts) {
    if (!seenUrls.has(p.url)) {
      seenUrls.add(p.url);
      hnPosts.push(p);
    }
  }
  // Then algolia posts (deduped)
  for (const batch of algoliaBatches) {
    for (const p of batch) {
      if (!seenUrls.has(p.url)) {
        seenUrls.add(p.url);
        hnPosts.push(p);
      }
    }
  }

  // Dedupe reddit posts by URL too
  const redditSeenUrls = new Set<string>();
  const dedupedReddit = redditPosts.filter((p) => {
    if (redditSeenUrls.has(p.url)) return false;
    redditSeenUrls.add(p.url);
    return true;
  });

  return {
    posts: [...dedupedReddit, ...hnPosts],
    warnings,
    sources: { reddit: dedupedReddit.length, hn: hnPosts.length },
  };
}
