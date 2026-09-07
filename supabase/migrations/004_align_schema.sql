-- RepoLens Migration 004: Align backend models with actual Supabase schema
-- Additive-only: no tables/columns are dropped.
-- Adds missing columns to existing tables and sets up RLS for child tables.

-- ── 1. profiles: add missing columns ────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider     TEXT NOT NULL DEFAULT 'email';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Unique index on email (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- ── 2. repositories: add missing columns ────────────────────────────────────
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS workspace_path   TEXT;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS file_count       INTEGER;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS total_size_bytes INTEGER;

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON public.repositories (user_id);

-- ── 3. analyses: add missing scalar columns ──────────────────────────────────
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS file_count        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS total_lines        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS primary_language   TEXT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS quality_score      DOUBLE PRECISION;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS blast_radius_max   DOUBLE PRECISION;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS blast_radius_avg   DOUBLE PRECISION;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS started_at         TIMESTAMPTZ;

-- analyses: add JSONB payload columns
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS graph_data           JSONB;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS quality_details      JSONB;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS testing_details      JSONB;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS vulnerability_details JSONB;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS sbom_details         JSONB;

-- Convert summary from TEXT to JSONB (safe — only runs if type is still text)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'analyses'
          AND column_name  = 'summary'
          AND data_type    = 'text'
    ) THEN
        -- Cast existing text rows to JSON (NULL-safe)
        ALTER TABLE public.analyses ALTER COLUMN summary TYPE JSONB USING
            CASE WHEN summary IS NULL OR summary = '' THEN NULL
                 ELSE summary::jsonb
            END;
    END IF;
END $$;

-- ── 4. analysis_findings: add file_path fallback column ──────────────────────
-- The column file_id is a UUID FK to analysis_files; file_path is a text fallback
-- for findings that have no corresponding analysis_files row (e.g. from legacy data).
ALTER TABLE public.analysis_findings ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.analysis_findings ADD COLUMN IF NOT EXISTS rule_id   TEXT;

-- ── 5. RLS for child tables ──────────────────────────────────────────────────

-- analysis_files
ALTER TABLE public.analysis_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_files: select via analysis" ON public.analysis_files;
CREATE POLICY "analysis_files: select via analysis"
    ON public.analysis_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_files.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "analysis_files: insert via analysis" ON public.analysis_files;
CREATE POLICY "analysis_files: insert via analysis"
    ON public.analysis_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_files.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

-- analysis_findings
ALTER TABLE public.analysis_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_findings: select via analysis" ON public.analysis_findings;
CREATE POLICY "analysis_findings: select via analysis"
    ON public.analysis_findings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_findings.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "analysis_findings: insert via analysis" ON public.analysis_findings;
CREATE POLICY "analysis_findings: insert via analysis"
    ON public.analysis_findings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_findings.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

-- analysis_graph_nodes
ALTER TABLE public.analysis_graph_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_graph_nodes: select via analysis" ON public.analysis_graph_nodes;
CREATE POLICY "analysis_graph_nodes: select via analysis"
    ON public.analysis_graph_nodes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_graph_nodes.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "analysis_graph_nodes: insert via analysis" ON public.analysis_graph_nodes;
CREATE POLICY "analysis_graph_nodes: insert via analysis"
    ON public.analysis_graph_nodes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_graph_nodes.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

-- analysis_graph_edges
ALTER TABLE public.analysis_graph_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_graph_edges: select via analysis" ON public.analysis_graph_edges;
CREATE POLICY "analysis_graph_edges: select via analysis"
    ON public.analysis_graph_edges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_graph_edges.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "analysis_graph_edges: insert via analysis" ON public.analysis_graph_edges;
CREATE POLICY "analysis_graph_edges: insert via analysis"
    ON public.analysis_graph_edges FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_graph_edges.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

-- analysis_dependencies
ALTER TABLE public.analysis_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_dependencies: select via analysis" ON public.analysis_dependencies;
CREATE POLICY "analysis_dependencies: select via analysis"
    ON public.analysis_dependencies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_dependencies.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "analysis_dependencies: insert via analysis" ON public.analysis_dependencies;
CREATE POLICY "analysis_dependencies: insert via analysis"
    ON public.analysis_dependencies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_dependencies.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

-- analysis_quality_scores
ALTER TABLE public.analysis_quality_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_quality_scores: select via analysis" ON public.analysis_quality_scores;
CREATE POLICY "analysis_quality_scores: select via analysis"
    ON public.analysis_quality_scores FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_quality_scores.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "analysis_quality_scores: insert via analysis" ON public.analysis_quality_scores;
CREATE POLICY "analysis_quality_scores: insert via analysis"
    ON public.analysis_quality_scores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_quality_scores.analysis_id
              AND (a.user_id IS NULL OR a.user_id = auth.uid())
        )
    );
