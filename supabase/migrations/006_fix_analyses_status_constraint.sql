-- RepoLens Migration 006: Fix analyses_status_check constraint
-- The constraint was created with lowercase values ['queued','running','completed','failed']
-- which does not match the Python AnalysisStatus enum (PENDING/RUNNING/COMPLETED/FAILED).
-- This migration drops the mismatched constraint and replaces it with the correct one.
-- Safe: the analyses table has 0 rows at time of creation; existing rows (if any) would
-- only have values from the Python enum, all of which are valid under the new constraint.

-- Drop the wrong constraint (lowercase values + wrong initial state name 'queued')
ALTER TABLE public.analyses DROP CONSTRAINT IF EXISTS analyses_status_check;

-- Add the correct constraint matching the Python AnalysisStatus enum
ALTER TABLE public.analyses
    ADD CONSTRAINT analyses_status_check
    CHECK (status = ANY (ARRAY['PENDING'::text, 'RUNNING'::text, 'COMPLETED'::text, 'FAILED'::text]));