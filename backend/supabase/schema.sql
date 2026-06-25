-- ==========================================
-- DIGILIANS ACHIEVEMENT PORTAL (DAP)
-- Master PostgreSQL DDL Schema & RLS Policies
-- ==========================================

-- Enable pgcrypto / uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL, -- Links to Supabase auth.users
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth_id = auth.uid());

CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- ==========================================
-- 2. COMPETITIONS TABLE
-- ==========================================
CREATE TABLE public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    competition_name TEXT NOT NULL,
    description TEXT,
    organization TEXT,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Shortlisted', 'Finalist', 'Winner', 'MVP Completed', 'Rejected')),
    verification_link TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Competitions
CREATE POLICY "Students can CRUD their own submissions" 
ON public.competitions FOR ALL 
USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view and update all submissions" 
ON public.competitions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- ==========================================
-- 3. ACTIVITY LOGS TABLE
-- ==========================================
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Activity Logs
CREATE POLICY "Users can view their own logs" 
ON public.activity_logs FOR SELECT 
USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view and create all logs" 
ON public.activity_logs FOR ALL 
USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- ==========================================
-- 4. STORAGE BUCKETS & POLICIES
-- ==========================================
-- Insert the 'competition-proofs' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'competition-proofs', 
    'competition-proofs', 
    true, 
    5242880, -- 5MB limit in bytes
    ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects (if not already enabled by Supabase default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage RLS Policies
CREATE POLICY "Students can upload proof files to their directory" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (
    bucket_id = 'competition-proofs' AND 
    auth.uid() = owner
);

CREATE POLICY "Students can update their own proof files" 
ON storage.objects FOR UPDATE 
TO public
USING (
    bucket_id = 'competition-proofs' AND 
    auth.uid() = owner
);

CREATE POLICY "Students and Admins can view proof files" 
ON storage.objects FOR SELECT 
TO public
USING (
    bucket_id = 'competition-proofs'
);

CREATE POLICY "Students can delete their own proof files" 
ON storage.objects FOR DELETE 
TO public
USING (
    bucket_id = 'competition-proofs' AND 
    auth.uid() = owner
);

