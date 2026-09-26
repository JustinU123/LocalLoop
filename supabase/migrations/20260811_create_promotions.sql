-- LocalLoop promotions for verified business profiles
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql
--
-- Phase 1: database foundation only. App publishing/map/profile integration follows later.

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'published',
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  promotion_code text,
  redemption_instructions text,
  terms_and_conditions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotions_status_check
    CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT promotions_schedule_check
    CHECK (end_at >= start_at),
  CONSTRAINT promotions_title_length_check
    CHECK (char_length(title) <= 60),
  CONSTRAINT promotions_description_length_check
    CHECK (char_length(description) <= 300),
  CONSTRAINT promotions_code_length_check
    CHECK (promotion_code IS NULL OR char_length(promotion_code) <= 20),
  CONSTRAINT promotions_redemption_length_check
    CHECK (
      redemption_instructions IS NULL
      OR char_length(redemption_instructions) <= 200
    ),
  CONSTRAINT promotions_terms_length_check
    CHECK (
      terms_and_conditions IS NULL
      OR char_length(terms_and_conditions) <= 300
    )
);

COMMENT ON TABLE public.promotions IS
  'Time-bound offers for verified LocalLoop businesses. Multiple concurrent promotions per business are allowed.';

COMMENT ON COLUMN public.promotions.status IS
  'draft/published/archived. V1 app publishes directly as published; archived supports owner end-early in later phases.';

COMMENT ON COLUMN public.promotions.start_at IS
  'Promotion becomes consumer-eligible at this instant (timestamptz).';

COMMENT ON COLUMN public.promotions.end_at IS
  'Promotion stops being consumer-eligible after this instant (timestamptz).';

DROP TRIGGER IF EXISTS promotions_set_updated_at ON public.promotions;

CREATE TRIGGER promotions_set_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS promotions_business_id_idx
  ON public.promotions (business_id);

CREATE INDEX IF NOT EXISTS promotions_status_idx
  ON public.promotions (status);

CREATE INDEX IF NOT EXISTS promotions_start_at_idx
  ON public.promotions (start_at);

CREATE INDEX IF NOT EXISTS promotions_end_at_idx
  ON public.promotions (end_at);

CREATE INDEX IF NOT EXISTS promotions_business_status_schedule_idx
  ON public.promotions (business_id, status, start_at, end_at);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Consumer-facing reads: published promotions that are currently within their schedule.
DROP POLICY IF EXISTS "Promotions: public read eligible published" ON public.promotions;
CREATE POLICY "Promotions: public read eligible published"
ON public.promotions
FOR SELECT
USING (
  status = 'published'
  AND start_at <= now()
  AND end_at >= now()
);

DROP POLICY IF EXISTS "Promotions: verified owners select own" ON public.promotions;
CREATE POLICY "Promotions: verified owners select own"
ON public.promotions
FOR SELECT
TO authenticated
USING (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Promotions: verified owners insert" ON public.promotions;
CREATE POLICY "Promotions: verified owners insert"
ON public.promotions
FOR INSERT
TO authenticated
WITH CHECK (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Promotions: verified owners update" ON public.promotions;
CREATE POLICY "Promotions: verified owners update"
ON public.promotions
FOR UPDATE
TO authenticated
USING (public.is_verified_business_owner(business_id))
WITH CHECK (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Promotions: verified owners delete" ON public.promotions;
CREATE POLICY "Promotions: verified owners delete"
ON public.promotions
FOR DELETE
TO authenticated
USING (public.is_verified_business_owner(business_id));

GRANT SELECT ON public.promotions TO anon;
GRANT SELECT ON public.promotions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
