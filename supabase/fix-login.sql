-- MINIMAL FIX FOR LOGIN ISSUE
-- Just create the essential tables needed for authentication

-- Safe type creation
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('employer', 'job_seeker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- The critical users table (this is what's missing for login)
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- The profiles table (for extended data)
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    personality_test_completed BOOLEAN DEFAULT FALSE,
    resume_parsed BOOLEAN DEFAULT FALSE,
    ai_analysis_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Basic indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Anyone can view basic user info" ON public.users
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own profile data" ON public.profiles
    FOR ALL USING (user_id = auth.uid());