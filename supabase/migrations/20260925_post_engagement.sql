-- Post likes and comments (server-authoritative engagement)
-- Apply in Supabase SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- post_likes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_likes_pkey PRIMARY KEY (post_id, user_id)
);

COMMENT ON TABLE public.post_likes IS
  'One like per user per post. Unlike removes the row.';

CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes (post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON public.post_likes (user_id);

-- ---------------------------------------------------------------------------
-- post_comments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT post_comments_body_not_empty CHECK (char_length(trim(body)) > 0)
);

COMMENT ON TABLE public.post_comments IS
  'Comments on published posts. Soft-delete via deleted_at.';

CREATE INDEX IF NOT EXISTS post_comments_post_id_idx
  ON public.post_comments (post_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS post_comments_author_user_id_idx
  ON public.post_comments (author_user_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_published_post_from_verified_business(target_post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.posts p
    INNER JOIN public.businesses b ON b.id = p.business_id
    WHERE p.id = target_post_id
      AND p.status = 'published'
      AND b.verification_status = 'verified'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_published_post_from_verified_business(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_published_post_from_verified_business(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS post_likes
-- ---------------------------------------------------------------------------

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post likes: read own" ON public.post_likes;
CREATE POLICY "Post likes: read own"
ON public.post_likes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Post likes: insert own" ON public.post_likes;
CREATE POLICY "Post likes: insert own"
ON public.post_likes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_published_post_from_verified_business(post_id)
  AND NOT public.is_business_owner_for_review(
    (SELECT p.business_id FROM public.posts p WHERE p.id = post_id),
    auth.uid()
  )
);

DROP POLICY IF EXISTS "Post likes: delete own" ON public.post_likes;
CREATE POLICY "Post likes: delete own"
ON public.post_likes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS post_comments
-- ---------------------------------------------------------------------------

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post comments: public read active" ON public.post_comments;
CREATE POLICY "Post comments: public read active"
ON public.post_comments
FOR SELECT
TO anon, authenticated
USING (
  deleted_at IS NULL
  AND public.is_published_post_from_verified_business(post_id)
);

DROP POLICY IF EXISTS "Post comments: insert own" ON public.post_comments;
CREATE POLICY "Post comments: insert own"
ON public.post_comments
FOR INSERT
TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND deleted_at IS NULL
  AND public.is_published_post_from_verified_business(post_id)
  AND NOT public.is_business_owner_for_review(
    (SELECT p.business_id FROM public.posts p WHERE p.id = post_id),
    auth.uid()
  )
);

DROP POLICY IF EXISTS "Post comments: soft delete own" ON public.post_comments;
CREATE POLICY "Post comments: soft delete own"
ON public.post_comments
FOR UPDATE
TO authenticated
USING (author_user_id = auth.uid())
WITH CHECK (author_user_id = auth.uid());

GRANT SELECT ON public.post_likes TO authenticated;
GRANT INSERT, DELETE ON public.post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;

-- ---------------------------------------------------------------------------
-- Public aggregate counts (no user identities)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_posts_engagement_counts(post_ids uuid[])
RETURNS TABLE (
  post_id uuid,
  like_count bigint,
  comment_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id AS post_id,
    (
      SELECT count(*)::bigint
      FROM public.post_likes l
      WHERE l.post_id = p.id
    ) AS like_count,
    (
      SELECT count(*)::bigint
      FROM public.post_comments c
      WHERE c.post_id = p.id
        AND c.deleted_at IS NULL
    ) AS comment_count
  FROM public.posts p
  WHERE p.id = ANY (post_ids)
    AND p.status = 'published';
$$;

REVOKE EXECUTE ON FUNCTION public.get_posts_engagement_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_posts_engagement_counts(uuid[]) TO anon, authenticated;

-- Owner analytics: totals + per published post (verified owner only)
CREATE OR REPLACE FUNCTION public.get_business_post_engagement_for_owner(target_business_id uuid)
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

  SELECT jsonb_build_object(
    'total_likes',
    COALESCE((
      SELECT count(*)::bigint
      FROM public.post_likes l
      INNER JOIN public.posts p ON p.id = l.post_id
      WHERE p.business_id = target_business_id
        AND p.status = 'published'
    ), 0),
    'total_comments',
    COALESCE((
      SELECT count(*)::bigint
      FROM public.post_comments c
      INNER JOIN public.posts p ON p.id = c.post_id
      WHERE p.business_id = target_business_id
        AND p.status = 'published'
        AND c.deleted_at IS NULL
    ), 0),
    'posts',
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'post_id', p.id,
          'like_count', (
            SELECT count(*)::bigint FROM public.post_likes l WHERE l.post_id = p.id
          ),
          'comment_count', (
            SELECT count(*)::bigint
            FROM public.post_comments c
            WHERE c.post_id = p.id AND c.deleted_at IS NULL
          )
        )
        ORDER BY p.created_at DESC
      )
      FROM public.posts p
      WHERE p.business_id = target_business_id
        AND p.status = 'published'
    ), '[]'::jsonb)
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_business_post_engagement_for_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_business_post_engagement_for_owner(uuid) TO authenticated;
