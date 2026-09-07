-- RepoLens: Initial Database Schema & Row-Level Security Migration
-- Creates application profiles, repositories, analyses, and findings tables.
-- Run directly against Supabase PostgreSQL database.

-- ── 1. Profiles Table ───────────────────────────────────────────────────────
-- Linked 1:1 with auth.users (Supabase Auth identity provider)
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT UNIQUE NOT NULL,                       -- verified JWT email
    display_name    TEXT,
    avatar_url      TEXT,
    provider        TEXT NOT NULL DEFAULT 'email',              -- 'email' | 'github' | 'google'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if profiles table pre-existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'email';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: select own row" ON public.profiles;
CREATE POLICY "profiles: select own row"
    ON public.profiles
    FOR SELECT
    USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles: update own row" ON public.profiles;
CREATE POLICY "profiles: update own row"
    ON public.profiles
    FOR UPDATE
    USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles: service role insert" ON public.profiles;
CREATE POLICY "profiles: service role insert"
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);

-- Legacy compatibility view for public.users if queried
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.profiles;

-- ── 2. Repositories Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.repositories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_type         TEXT NOT NULL,                            -- 'github' | 'zip'
    source_url          TEXT NOT NULL,
    name                TEXT,
    default_branch      TEXT,
    primary_language    TEXT,
    description         TEXT,
    latest_commit_sha   TEXT,
    workspace_path      TEXT,
    file_count          INTEGER,
    total_size_bytes    INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure user_id exists if repositories table pre-existed
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON public.repositories (user_id);
CREATE INDEX IF NOT EXISTS uix_user_source_type_url ON public.repositories (user_id, source_type, source_url);

ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repositories: select own or public" ON public.repositories;
CREATE POLICY "repositories: select own or public"
    ON public.repositories
    FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "repositories: insert own" ON public.repositories;
CREATE POLICY "repositories: insert own"
    ON public.repositories
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "repositories: update own" ON public.repositories;
CREATE POLICY "repositories: update own"
    ON public.repositories
    FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "repositories: delete own" ON public.repositories;
CREATE POLICY "repositories: delete own"
    ON public.repositories
    FOR DELETE
    USING (user_id = auth.uid());

-- ── 3. Analyses Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id       UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'PENDING',          -- 'PENDING'|'RUNNING'|'COMPLETED'|'FAILED'
    error_message       TEXT,
    commit_sha          TEXT,
    file_count          INTEGER NOT NULL DEFAULT 0,
    total_lines         INTEGER NOT NULL DEFAULT 0,
    primary_language    TEXT,
    quality_score       DOUBLE PRECISION,
    blast_radius_max    DOUBLE PRECISION,
    blast_radius_avg    DOUBLE PRECISION,
    summary             JSONB,
    graph_data          JSONB,
    quality_details     JSONB,
    testing_details     JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

-- Ensure user_id exists if analyses table pre-existed
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_analyses_repository_id ON public.analyses (repository_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses (user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses (status);

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

DROP POLICY IF EXISTS "analyses: update own" ON public.analyses;
CREATE POLICY "analyses: update own"
    ON public.analyses
    FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "analyses: delete own" ON public.analyses;
CREATE POLICY "analyses: delete own"
    ON public.analyses
    FOR DELETE
    USING (user_id = auth.uid());

-- ── 4. Findings Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.findings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id         UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    category            TEXT NOT NULL,                            -- 'ARCHITECTURE'|'SECURITY'|'DEPENDENCY'|'CODE_QUALITY'
    severity            TEXT NOT NULL,                            -- 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    file_path           TEXT NOT NULL,
    line_number         INTEGER,
    evidence            TEXT,
    suggested_fix       TEXT,
    metadata_payload    JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_findings_analysis_id ON public.findings (analysis_id);
CREATE INDEX IF NOT EXISTS ix_findings_analysis_category ON public.findings (analysis_id, category);
CREATE INDEX IF NOT EXISTS ix_findings_analysis_severity ON public.findings (analysis_id, severity);

ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "findings: select via analysis" ON public.findings;
CREATE POLICY "findings: select via analysis"
    ON public.findings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = findings.analysis_id 
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

COMMENT ON TABLE public.profiles IS 'Application user profiles linked 1:1 with Supabase auth.users.';
COMMENT ON TABLE public.repositories IS 'Repository metadata ingested by users.';
COMMENT ON TABLE public.analyses IS 'Static analysis runs and AST evaluation telemetry.';
COMMENT ON TABLE public.findings IS 'Audit findings, security vectors, and architectural debt items.';
