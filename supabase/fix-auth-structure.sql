-- FIX AUTH STRUCTURE TO MATCH YOUR CODE
-- Based on actual database inspection

-- Your current profiles table has role field, but code expects it in users table
-- Solution: Create users table and migrate role data

-- Step 1: Create the users table that your code expects
CREATE TABLE IF NOT EXISTS public.users (
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

-- Step 2: Migrate existing profiles data to users table
INSERT INTO public.users (id, email, full_name, role, avatar_url, phone, location, bio, created_at, updated_at)
SELECT 
    id,
    email,
    COALESCE(first_name || ' ' || last_name, email) as full_name,
    role,
    avatar_url,
    phone,
    location,
    bio,
    created_at,
    updated_at
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio;

-- Step 3: Add user_id column to profiles and populate it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;

-- Populate user_id with the same value as id (since they reference the same auth user)
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 5: Add the AI-related columns your code expects
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_test_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_parsed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_analysis_completed BOOLEAN DEFAULT FALSE;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Step 7: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 8: Create basic RLS policies for users table
DO $$ BEGIN
    CREATE POLICY "Anyone can view basic user info" ON public.users
        FOR SELECT USING (TRUE);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own profile" ON public.users
        FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;