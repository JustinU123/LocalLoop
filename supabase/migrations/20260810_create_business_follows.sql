-- LocalLoop persistent business follows (one row per user per business)
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql

CREATE TABLE IF NOT EXISTS public.business_follows (
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  follower_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_follows_pkey PRIMARY KEY (business_id, follower_user_id)
);

COMMENT ON TABLE public.business_follows IS
  'Authenticated users following verified businesses. One follow row per user per business.';

CREATE INDEX IF NOT EXISTS business_follows_follower_user_id_idx
  ON public.business_follows (follower_user_id);

CREATE INDEX IF NOT EXISTS business_follows_business_id_idx
  ON public.business_follows (business_id);

-- ---------------------------------------------------------------------------
-- Public follower count (no exposure of follower identities)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_business_follower_count(target_business_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)::bigint
  FROM public.business_follows AS f
  INNER JOIN public.businesses AS b ON b.id = f.business_id
  WHERE f.business_id = target_business_id
    AND b.verification_status = 'verified';
$$;

COMMENT ON FUNCTION public.get_business_follower_count(uuid) IS
  'Returns follower count for a verified business without exposing follower user IDs.';

REVOKE EXECUTE ON FUNCTION public.get_business_follower_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_business_follower_count(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.business_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business follows: read own" ON public.business_follows;
CREATE POLICY "Business follows: read own"
ON public.business_follows
FOR SELECT
TO authenticated
USING (follower_user_id = auth.uid());

DROP POLICY IF EXISTS "Business follows: insert own" ON public.business_follows;
CREATE POLICY "Business follows: insert own"
ON public.business_follows
FOR INSERT
TO authenticated
WITH CHECK (
  follower_user_id = auth.uid()
  AND public.is_verified_business_for_public_read(business_id)
  AND NOT public.is_business_owner_for_review(business_id, auth.uid())
);

DROP POLICY IF EXISTS "Business follows: delete own" ON public.business_follows;
CREATE POLICY "Business follows: delete own"
ON public.business_follows
FOR DELETE
TO authenticated
USING (follower_user_id = auth.uid());
