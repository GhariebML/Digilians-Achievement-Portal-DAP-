-- Add missing columns to competitions table
ALTER TABLE public.competitions 
ADD COLUMN IF NOT EXISTS project_name TEXT,
ADD COLUMN IF NOT EXISTS demo_link TEXT,
ADD COLUMN IF NOT EXISTS github_repo TEXT,
ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::jsonb;
