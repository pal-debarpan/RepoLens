-- RepoLens Migration 005: Verify and document analyses.updated_at constraint
-- Status: The PostgreSQL column already has DEFAULT now() and NOT NULL set correctly.
-- This migration is a safe no-op guard that documents the intended schema state.
-- The actual bug (NotNullViolation) was caused by the SQLAlchemy model lacking
-- default=utc_now and onupdate=utc_now -- fixed in app/models/analysis.py.

-- Backfill any NULLs defensively (will affect 0 rows given current state)
UPDATE public.analyses
SET updated_at = COALESCE(created_at, now())
WHERE updated_at IS NULL;

-- Ensure DEFAULT is set (idempotent)
ALTER TABLE public.analyses
    ALTER COLUMN updated_at SET DEFAULT now();

-- Ensure NOT NULL (idempotent)
ALTER TABLE public.analyses
    ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN public.analyses.updated_at IS
    'Timestamp of the last modification to this analysis record. Set on creation and updated automatically on every change. NOT NULL, DEFAULT now().';