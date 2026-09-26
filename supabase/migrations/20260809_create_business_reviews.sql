-- LocalLoop business reviews (one review per user per verified business)
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql

CREATE TABLE IF NOT EXISTS public.business_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_reviews_rating_check
    CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT business_reviews_one_per_user
    UNIQUE (business_id, author_user_id)
);

COMMENT ON TABLE public.business_reviews IS
  'Customer reviews for verified businesses. One active review per authenticated user per business.';

COMMENT ON COLUMN public.business_reviews.rating IS
  'Whole-star rating from 1 to 5 only.';

DROP TRIGGER IF EXISTS business_reviews_set_updated_at ON public.business_reviews;

CREATE TRIGGER business_reviews_set_updated_at
BEFORE UPDATE ON public.business_reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS business_reviews_business_id_idx
  ON public.business_reviews (business_id);

CREATE INDEX IF NOT EXISTS business_reviews_author_user_id_idx
  ON public.business_reviews (author_user_id);

CREATE INDEX IF NOT EXISTS business_reviews_business_created_idx
  ON public.business_reviews (business_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_business_owner_for_review(
  target_business_id uuid,
  target_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = target_business_id
      AND b.owner_user_id = target_user_id
  );
$$;

COMMENT ON FUNCTION public.is_business_owner_for_review(uuid, uuid) IS
  'True when target_user_id owns the business. Used to block self-reviews.';

REVOKE EXECUTE ON FUNCTION public.is_business_owner_for_review(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_owner_for_review(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_verified_business_for_public_read(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = target_business_id
      AND b.verification_status = 'verified'
  );
$$;

COMMENT ON FUNCTION public.is_verified_business_for_public_read(uuid) IS
  'True when the business exists and is verified (public profile eligible).';

REVOKE EXECUTE ON FUNCTION public.is_verified_business_for_public_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_verified_business_for_public_read(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business reviews: public read verified businesses" ON public.business_reviews;
CREATE POLICY "Business reviews: public read verified businesses"
ON public.business_reviews
FOR SELECT
TO anon, authenticated
USING (public.is_verified_business_for_public_read(business_id));

DROP POLICY IF EXISTS "Business reviews: author insert" ON public.business_reviews;
CREATE POLICY "Business reviews: author insert"
ON public.business_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND public.is_verified_business_for_public_read(business_id)
  AND NOT public.is_business_owner_for_review(business_id, auth.uid())
);

DROP POLICY IF EXISTS "Business reviews: author update" ON public.business_reviews;
CREATE POLICY "Business reviews: author update"
ON public.business_reviews
FOR UPDATE
TO authenticated
USING (author_user_id = auth.uid())
WITH CHECK (
  author_user_id = auth.uid()
  AND public.is_verified_business_for_public_read(business_id)
  AND NOT public.is_business_owner_for_review(business_id, auth.uid())
);

DROP POLICY IF EXISTS "Business reviews: author delete" ON public.business_reviews;
CREATE POLICY "Business reviews: author delete"
ON public.business_reviews
FOR DELETE
TO authenticated
USING (author_user_id = auth.uid());
