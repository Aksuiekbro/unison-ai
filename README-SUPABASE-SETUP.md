# Supabase Setup Instructions:

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

## 2. Set up Environment Variables

Create a `.env.local` file in the root of your project with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these values in your Supabase dashboard under Settings > API.

## 3. Create User Profiles Table

In your Supabase SQL editor, run the following migration:

```sql
-- Create user_profiles table
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('employer', 'job-seeker')) NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
```

## 4. Configure Authentication Settings

1. In your Supabase dashboard, go to Authentication > Settings
2. Under "Site URL", add your local development URL: `http://localhost:3000`
3. Under "Redirect URLs", add: `http://localhost:3000/auth/callback` (if needed for future OAuth integration)

## 5. Test the Setup

1. Run `pnpm dev` to start the development server
2. Navigate to `/auth/signup` to create a test account
3. Check your Supabase dashboard to see if the user and profile were created successfully

## 6. Optional: Email Templates

You can customize the email templates for password reset, email confirmation, etc. in:
Authentication > Email Templates

## 7. Production Setup

For production, make sure to:
1. Update the Site URL and Redirect URLs in Supabase settings
2. Set the environment variables in your deployment platform
3. Consider setting up custom SMTP for email delivery
