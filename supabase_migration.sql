-- DesignForge Complete Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jxwljrqnrrcrkdxbmxyy/sql/new

-- ============================================
-- 1. TABLES
-- ============================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 5,
  plan TEXT NOT NULL DEFAULT 'free',
  api_keys JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  thumbnail_url TEXT,
  github_repo_url TEXT,
  github_repo_name TEXT,
  github_owner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Sections
CREATE TABLE IF NOT EXISTS public.project_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  selected_design_id UUID,
  generated_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Section Designs
CREATE TABLE IF NOT EXISTS public.section_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.project_sections(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated Assets
CREATE TABLE IF NOT EXISTS public.generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.project_sections(id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Projects
DROP POLICY IF EXISTS "Users can read own projects" ON public.projects;
CREATE POLICY "Users can read own projects" ON public.projects FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (user_id = auth.uid());

-- Project Sections
DROP POLICY IF EXISTS "Users can read own sections" ON public.project_sections;
CREATE POLICY "Users can read own sections" ON public.project_sections FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own sections" ON public.project_sections;
CREATE POLICY "Users can insert own sections" ON public.project_sections FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update own sections" ON public.project_sections;
CREATE POLICY "Users can update own sections" ON public.project_sections FOR UPDATE USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete own sections" ON public.project_sections;
CREATE POLICY "Users can delete own sections" ON public.project_sections FOR DELETE USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Section Designs
DROP POLICY IF EXISTS "Users can read own designs" ON public.section_designs;
CREATE POLICY "Users can read own designs" ON public.section_designs FOR SELECT USING (section_id IN (SELECT ps.id FROM public.project_sections ps JOIN public.projects p ON ps.project_id = p.id WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own designs" ON public.section_designs;
CREATE POLICY "Users can insert own designs" ON public.section_designs FOR INSERT WITH CHECK (section_id IN (SELECT ps.id FROM public.project_sections ps JOIN public.projects p ON ps.project_id = p.id WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update own designs" ON public.section_designs;
CREATE POLICY "Users can update own designs" ON public.section_designs FOR UPDATE USING (section_id IN (SELECT ps.id FROM public.project_sections ps JOIN public.projects p ON ps.project_id = p.id WHERE p.user_id = auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Generated Assets
DROP POLICY IF EXISTS "Users can read own assets" ON public.generated_assets;
CREATE POLICY "Users can read own assets" ON public.generated_assets FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own assets" ON public.generated_assets;
CREATE POLICY "Users can insert own assets" ON public.generated_assets FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- ============================================
-- 4. GRANTS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- 5. AUTO-CREATE PROFILE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. RELOAD SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
