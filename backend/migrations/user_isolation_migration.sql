-- RepoLens: User Isolation & Multi-tenancy Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)

-- 1. Add user_id column to repositories if not exists
ALTER TABLE public.repositories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Create index on repositories.user_id for high-performance tenant filtering
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON public.repositories (user_id);

-- 3. Drop global unique constraint on source_type and source_url if exists
ALTER TABLE public.repositories DROP CONSTRAINT IF EXISTS uix_source_type_url;
DROP INDEX IF EXISTS uix_source_type_url;

-- 4. Create composite index for tenant-scoped repository lookups
CREATE INDEX IF NOT EXISTS uix_user_source_type_url ON public.repositories (user_id, source_type, source_url);

-- 5. Enable Row-Level Security on repositories table
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

-- 6. Repositories RLS Policies:
-- Users can select their own repositories or public demo repositories (where user_id is NULL)
DROP POLICY IF EXISTS "repositories: select own or public" ON public.repositories;
CREATE POLICY "repositories: select own or public"
    ON public.repositories
    FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());

-- Users can insert repositories with their own user_id
DROP POLICY IF EXISTS "repositories: insert own" ON public.repositories;
CREATE POLICY "repositories: insert own"
    ON public.repositories
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can update only their own repositories
DROP POLICY IF EXISTS "repositories: update own" ON public.repositories;
CREATE POLICY "repositories: update own"
    ON public.repositories
    FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete only their own repositories
DROP POLICY IF EXISTS "repositories: delete own" ON public.repositories;
CREATE POLICY "repositories: delete own"
    ON public.repositories
    FOR DELETE
    USING (user_id = auth.uid());

-- 7. Analyses RLS Policies:
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analyses: select own or public" ON public.analyses;
CREATE POLICY "analyses: select own or public"
    ON public.analyses
    FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "analyses: insert own" ON public.analyses;
CREATE POLICY "analyses: insert own"
    ON public.analyses
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
