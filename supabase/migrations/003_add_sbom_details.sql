-- RepoLens Migration 003: Add sbom_details to analyses table
-- Stores CycloneDX 1.5 JSON Software Bill of Materials (SBOM)

ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS sbom_details JSONB;

COMMENT ON COLUMN public.analyses.sbom_details IS 'CycloneDX 1.5 JSON Software Bill of Materials (SBOM) payload and dependency graph';
