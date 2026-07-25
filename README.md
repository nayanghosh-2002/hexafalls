# Sealit

**Build things that need to exist.**

Sealit scrapes real, unsolved problems from Reddit and Hacker News, structures them into
build-ready briefs with Gemini, and delivers a feed personalized to your stack — so you always
know what to build next.

<p align="left">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white">
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-AI-8E75B2?logo=googlegemini&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white">
</p>

---

## Screenshots

<!--
  Drop your screenshots into docs/screenshots/ using the filenames below and
  they'll render automatically — no README changes needed.
-->

| Landing | Feed |
|---|---|
| ![Landing page](docs/screenshots/landing.png) | ![Personalized feed](docs/screenshots/feed.png) |

| Problem Detail | Onboarding |
|---|---|
| ![Problem detail with Gemini build ideas](docs/screenshots/problem-detail.png) | ![Onboarding — stack and domain picker](docs/screenshots/onboarding.png) |

| Building Tracker | Project Analytics |
|---|---|
| ![Building tracker](docs/screenshots/building.png) | ![GitHub project analytics](docs/screenshots/project-analytics.png) |

---

## Features

- **Personalized feed** — problem cards ranked and tagged for your exact stack, sourced live from Reddit and Hacker News
- **AI structuring** — Gemini turns raw posts into headline, context, difficulty, time estimate, and an honest "does a solution already exist?" score, so solved problems get filtered out automatically
- **Build ideas** — Gemini generates 3 concrete weekend-buildable projects per problem, referencing your actual stack by name
- **Onboarding via links** — paste your GitHub/LinkedIn/portfolio URLs (or connect GitHub OAuth) and Gemini extracts your stack, domains, experience, and certifications automatically
- **GitHub project analytics** — synced repos get an AI completeness score, competitor comparison, and gap analysis at `/project/[owner]/[repo]`
- **Saved problems & building tracker** — bookmark problems, track them through idea → MVP → shipped
- **Live scraper** — manual "Run scraper" trigger plus a scheduled cron job, with a toast when new problems land
- **Opportunity scoring** — combined market-pain × feasibility × competition-gap score per problem
- **Auth** — email/password and Google/GitHub OAuth via Supabase, with onboarding-completion gating

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Database & Auth | [Supabase](https://supabase.com/) (Postgres + Row Level Security + Auth) |
| AI | [Gemini API](https://ai.google.dev/) — post structuring, build ideas, profile/project analysis |
| Scraping | Axios + Cheerio (Reddit, HN Algolia/Firebase API) |
| Scheduling | Vercel Cron |
| Deployment | Vercel |

## Quick Start

```bash
cd sealit-app
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY — the app runs on seed data even without Supabase configured
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Recommended | Powers AI structuring, build suggestions, and project analysis |
| `GEMINI_MODEL` | Optional | Overrides the default model (`gemini-2.5-flash-lite`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Required for the scraper to save problems (Supabase → Settings → API → `service_role`) |
| `CRON_SECRET` | Production | Protects `/api/cron/scrape` from unauthenticated calls |

Without Supabase configured, the app falls back to seed data with an in-memory store for scraped
problems — handy for trying the UI without setting up a database.

## Supabase Setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. It's idempotent — safe to
   re-run any time the schema changes (new columns/tables use `IF NOT EXISTS` guards), so re-run
   it whenever you pull changes that touch the schema.
3. Add the project URL and keys to `.env.local`.
4. Enable the Google/GitHub providers under **Authentication → Providers** if you want OAuth login.

## Scraping Pipeline

Runs automatically every 30 minutes via Vercel Cron (`vercel.json`), or on demand from the
"⚡ Run scraper" button in the feed:

1. Scrape r/SomebodyMakeThis, r/startups, r/entrepreneur, r/nocode, r/SideProject, r/webdev, and
   targeted Ask HN queries
2. Send each raw post to Gemini → structured problem card + solution-exists score
3. Drop anything with a solid, widely-adopted solution already (score ≥ 7)
4. Store new problems in Supabase, deduped by source URL
5. Feed polls every 15s → toast on new problem

If the Gemini spending cap is hit mid-run, the pipeline stops cleanly and surfaces a clear error
instead of silently dropping posts — check the response from `/api/scrape` or the cron logs.

> **Vercel Cron on Pro**: the Pro plan allows cron jobs to run as often as once per minute (Hobby
> is limited to once/day). `vercel.json` is set to `*/30 * * * *`; adjust the schedule there if you
> want a tighter or looser cadence.

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/problems` | GET | List problems (last 24h) |
| `/api/problems/[id]` | GET | Single problem |
| `/api/suggest` | POST | Gemini build ideas for the user's stack |
| `/api/scrape` | POST | Manual scrape trigger |
| `/api/cron/scrape` | GET | Scheduled scrape (Vercel Cron, every 30 min) |
| `/api/stats` | GET | Live builder counter stats |
| `/api/profile/analyze-links` | POST | Extract stack/domains/profile from onboarding links |
| `/api/user/profile` | GET/PUT | User onboarding profile |
| `/api/user/saved` | GET/POST/DELETE | Saved problems |
| `/api/user/building` | GET/POST/PATCH | Building tracker |
| `/api/user/projects` | GET/POST | Sync and list GitHub repos |
| `/api/project/[owner]/[repo]` | GET | AI analysis for a synced repo |
| `/api/setup-status` | GET | Reports which env vars are configured |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # login, signup, forgot-password — shared auth layout
│   ├── (app)/            # feed, saved, building, profile, problem/[id], project/[owner]/[repo]
│   ├── onboarding/       # link-based or manual profile setup
│   ├── auth/callback/    # OAuth + email-confirmation callback
│   └── api/              # route handlers listed above
├── components/            # UI components (feed cards, auth shell, Bo mascot, etc.)
├── lib/                   # auth, supabase clients, gemini, scraper, pipeline, project analysis
└── middleware.ts          # session refresh + auth/onboarding route guards
supabase/
└── schema.sql             # tables, RLS policies, and the get_random_problems() function
```

## Screens

- **Landing** — hero with scattered problem cards and a live builder counter
- **Login / Signup** — email + Google + GitHub, gated so an already-authenticated visitor is
  redirected straight to the feed (or onboarding, if incomplete)
- **Onboarding** — paste links for Gemini to auto-fill your profile, or step through stack →
  domains → goal manually
- **Feed** — personalized problem cards with source tags and live polling
- **Problem Detail** — full context, "what's been tried," Gemini build ideas, raw source comparison
- **Saved** — grid of bookmarked problems
- **Building** — track problems through idea → MVP → shipped, with related discussion pulled in
- **Profile** — stack, domains, experience, certifications, synced GitHub repos
- **Project Analytics** — AI completeness score, competitor comparison, and gap analysis per repo
