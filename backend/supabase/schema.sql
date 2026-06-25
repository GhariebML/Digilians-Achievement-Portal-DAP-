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
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'))
);

-- ==========================================
-- 2. OTP TABLE
-- ==========================================
CREATE TABLE public.otp (
    otp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. SESSIONS TABLE
-- ==========================================
CREATE TABLE public.sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    device TEXT,
    ip_address TEXT,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. COMPETITIONS TABLE
-- ==========================================
CREATE TABLE public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
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

-- ==========================================
-- 5. ACTIVITY LOGS TABLE
-- ==========================================
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view profile via service_role" ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY "OTP read/write via service_role" ON public.otp FOR ALL TO service_role USING (true);
CREATE POLICY "Sessions read/write via service_role" ON public.sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Competitions read/write via service_role" ON public.competitions FOR ALL TO service_role USING (true);
CREATE POLICY "Activity logs read/write via service_role" ON public.activity_logs FOR ALL TO service_role USING (true);

-- ==========================================
-- 6. STORAGE BUCKETS & POLICIES
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

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage proof files via service role" 
ON storage.objects FOR ALL 
TO service_role
USING (bucket_id = 'competition-proofs');

CREATE POLICY "Public select proof files" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'competition-proofs');


