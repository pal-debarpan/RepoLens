-- Keep analyses.updated_at correct for every writer, including SQLAlchemy,
-- Supabase SQL tools, and background workers. This is additive and preserves
-- all existing analysis records.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS analyses_set_updated_at ON public.analyses;
CREATE TRIGGER analyses_set_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.analyses
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;
