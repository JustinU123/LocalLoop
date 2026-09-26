-- Public post comment thread for Explore (display names only, active comments)
-- Apply after 20260925_post_engagement.sql

CREATE OR REPLACE FUNCTION public.get_post_comments_for_feed(target_post_id uuid)
RETURNS TABLE (
  id uuid,
  author_user_id uuid,
  body text,
  created_at timestamptz,
  author_display_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    c.id,
    c.author_user_id,
    c.body,
    c.created_at,
    NULLIF(btrim(p.display_name), '') AS author_display_name
  FROM public.post_comments c
  LEFT JOIN public.profiles p ON p.id = c.author_user_id
  WHERE c.post_id = target_post_id
    AND c.deleted_at IS NULL
    AND public.is_published_post_from_verified_business(target_post_id)
  ORDER BY c.created_at ASC;
$$;

COMMENT ON FUNCTION public.get_post_comments_for_feed(uuid) IS
  'Active comments for a published post with author display_name only (no email/private fields).';

REVOKE EXECUTE ON FUNCTION public.get_post_comments_for_feed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_post_comments_for_feed(uuid) TO anon, authenticated;
