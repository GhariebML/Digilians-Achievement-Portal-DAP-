-- ====================================================
-- DIGILIANS ACHIEVEMENT PORTAL - SUPABASE AUTH MIGRATION DDL
-- ====================================================

-- 1. Create Profiles Table (Phase 5)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    university TEXT,
    faculty TEXT,
    academic_year TEXT,
    track TEXT,
    batch TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Profiles RLS Policies (Phase 7)
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Allow service_role full control on profiles" ON public.profiles;
CREATE POLICY "Allow service_role full control on profiles" 
ON public.profiles FOR ALL 
TO service_role 
USING (true);

-- 3. Modify Competitions Table (Phase 6 & 10)
-- Add owner_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competitions' AND column_name='owner_id') THEN
        ALTER TABLE public.competitions ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- If user_id exists, migrate existing competition references to owner_id
-- Since user_id are UUIDs from our public.users table, we will migrate those users first,
-- so user_id in competitions can map directly to the same UUID in auth.users!
UPDATE public.competitions 
SET owner_id = user_id 
WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- Make owner_id NOT NULL after migration
ALTER TABLE public.competitions ALTER COLUMN owner_id SET NOT NULL;

-- Enable RLS on Competitions
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- 4. Create Competitions RLS Policies (Phase 7)
DROP POLICY IF EXISTS "Users can select own competitions" ON public.competitions;
CREATE POLICY "Users can select own competitions" 
ON public.competitions FOR SELECT 
TO authenticated 
USING (owner_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can insert own competitions" ON public.competitions;
CREATE POLICY "Users can insert own competitions" 
ON public.competitions FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own competitions" ON public.competitions;
CREATE POLICY "Users can update own competitions" 
ON public.competitions FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can delete own competitions" ON public.competitions;
CREATE POLICY "Users can delete own competitions" 
ON public.competitions FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Allow service_role full control on competitions" ON public.competitions;
CREATE POLICY "Allow service_role full control on competitions" 
ON public.competitions FOR ALL 
TO service_role 
USING (true);

-- 5. Create automatic handle_new_user profile creation trigger (Phase 5)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, university, faculty, academic_year, track, batch, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'university', ''),
    COALESCE(new.raw_user_meta_data->>'faculty', ''),
    COALESCE(new.raw_user_meta_data->>'academic_year', ''),
    COALESCE(new.raw_user_meta_data->>'track', ''),
    COALESCE(new.raw_user_meta_data->>'batch', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user when user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
