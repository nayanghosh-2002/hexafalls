-- Sealit Supabase Schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  context TEXT NOT NULL,
  tried_before TEXT NOT NULL,
  builders_count INTEGER DEFAULT 0,
  builders_started_pct INTEGER DEFAULT 0,
  source TEXT NOT NULL CHECK (source IN ('reddit', 'hn')),
  source_url TEXT NOT NULL UNIQUE,
  raw_post TEXT NOT NULL,
  time_estimate TEXT,
  tags TEXT[] DEFAULT '{}',
  opportunity_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_domain ON problems (domain);

-- User onboarding profile (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stack TEXT[] DEFAULT '{}',
  domains TEXT[] DEFAULT '{}',
  goal TEXT CHECK (goal IN ('side_project', 'hackathon', 'startup')),
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved problems per user
CREATE TABLE IF NOT EXISTS saved_problems (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_problems_user ON saved_problems (user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_problems_problem ON saved_problems (problem_id);

-- Active builds per user
CREATE TABLE IF NOT EXISTS building_projects (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  stage TEXT DEFAULT 'idea' CHECK (stage IN ('idea', 'mvp', 'shipped')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_building_projects_user ON building_projects (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_building_projects_problem ON building_projects (problem_id);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own saves" ON saved_problems
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saves" ON saved_problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saves" ON saved_problems
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users read own builds" ON building_projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own builds" ON building_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own builds" ON building_projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own builds" ON building_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Problems are public read (feed)
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read problems" ON problems
  FOR SELECT USING (true);

-- Enable realtime for live feed updates
ALTER PUBLICATION supabase_realtime ADD TABLE problems;

-- Migration for existing deployments (safe to re-run)
ALTER TABLE problems ADD COLUMN IF NOT EXISTS opportunity_score INTEGER;

-- Pipeline v2 migration: AI filter + gap analysis columns
ALTER TABLE problems ADD COLUMN IF NOT EXISTS solution_exists_score INTEGER;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS gap_analysis TEXT;

-- Random feed function: returns a random sample of problems each call
-- Enables true randomisation without fetching the whole table in JS
CREATE OR REPLACE FUNCTION get_random_problems(limit_count INTEGER DEFAULT 200)
RETURNS SETOF problems
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM problems ORDER BY RANDOM() LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION get_random_problems TO anon, authenticated;

-- GitHub profile integration
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS github_username TEXT;

-- Rich profile fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS links TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;

-- User projects (imported from GitHub)
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  description TEXT,
  language TEXT,
  stars INTEGER DEFAULT 0,
  topics TEXT[] DEFAULT '{}',
  readme_content TEXT,
  analysis JSONB,
  analysis_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, github_username, repo_name)
);

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON user_projects
  FOR ALL USING (auth.uid() = user_id);
