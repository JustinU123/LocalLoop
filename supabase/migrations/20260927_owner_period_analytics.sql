-- Owner-safe period aggregates for engagement and follower growth.
-- Period is defined by period_start (inclusive): event created_at >= period_start.
-- Apply after 20260925_post_engagement.sql and 20260810_create_business_follows.sql.

-- ---------------------------------------------------------------------------
-- Period engagement (likes + comments received during window)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_business_post_engagement_for_owner_period(
  target_business_id uuid,
  period_start timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_verified_business_owner(target_business_id) THEN
    RETURN NULL;
  END IF;

  IF period_start IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'likes_received',
    COALESCE((
      SELECT count(*)::bigint
      FROM public.post_likes l
      INNER JOIN public.posts p ON p.id = l.post_id
      WHERE p.business_id = target_business_id
        AND p.status = 'published'
        AND l.created_at >= period_start
    ), 0),
    'comments_received',
    COALESCE((
      SELECT count(*)::bigint
      FROM public.post_comments c
      INNER JOIN public.posts p ON p.id = c.post_id
      WHERE p.business_id = target_business_id
        AND p.status = 'published'
        AND c.deleted_at IS NULL
        AND c.created_at >= period_start
    ), 0)
  )
  INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_business_post_engagement_for_owner_period(uuid, timestamptz) IS
  'Verified owner only. Counts likes/comments received on published posts during [period_start, now). Event time is like/comment created_at, not post created_at.';

REVOKE EXECUTE ON FUNCTION public.get_business_post_engagement_for_owner_period(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_business_post_engagement_for_owner_period(uuid, timestamptz) TO authenticated;

-- ---------------------------------------------------------------------------
-- Period follower growth
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_business_follower_growth_for_owner_period(
  target_business_id uuid,
  period_start timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_verified_business_owner(target_business_id) THEN
    RETURN NULL;
  END IF;

  IF period_start IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'followers_gained',
    COALESCE((
      SELECT count(*)::bigint
      FROM public.business_follows f
      WHERE f.business_id = target_business_id
        AND f.created_at >= period_start
    ), 0)
  )
  INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_business_follower_growth_for_owner_period(uuid, timestamptz) IS
  'Verified owner only. Counts new follows during [period_start, now). Does not expose follower identities.';

REVOKE EXECUTE ON FUNCTION public.get_business_follower_growth_for_owner_period(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_business_follower_growth_for_owner_period(uuid, timestamptz) TO authenticated;
