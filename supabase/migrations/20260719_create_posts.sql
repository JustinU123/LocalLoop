-- LocalLoop posts foundation migration
-- Run once in the Supabase Dashboard → SQL Editor after:
--   supabase/migrations/20260718_create_profiles_and_businesses.sql
--
-- Creates public.posts for simple business photo posts.
-- Does NOT create storage buckets or modify profiles/businesses schemas.

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  caption text,
  image_url text,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT posts_status_check
    CHECK (status IN ('draft', 'published', 'archived'))
);

COMMENT ON TABLE public.posts IS
  'Simple business photo posts. Future app UI should require at least caption or image before publish.';

COMMENT ON COLUMN public.posts.caption IS
  'Optional for now at the database level. Future app validation should require caption or image_url.';

COMMENT ON COLUMN public.posts.image_url IS
  'Optional for now at the database level. Future app validation should require caption or image_url.';

COMMENT ON COLUMN public.posts.status IS
  'Only published posts are readable by the public. Owners manage draft/published/archived states.';

-- Reuse the shared updated_at trigger function from the foundation migration.
DROP TRIGGER IF EXISTS posts_set_updated_at ON public.posts;

CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS posts_business_id_idx
  ON public.posts (business_id);

CREATE INDEX IF NOT EXISTS posts_created_at_desc_idx
  ON public.posts (created_at DESC);

CREATE INDEX IF NOT EXISTS posts_status_idx
  ON public.posts (status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 1. Public read access for published posts only.
DROP POLICY IF EXISTS "Posts: public read published" ON public.posts;
CREATE POLICY "Posts: public read published"
ON public.posts
FOR SELECT
USING (status = 'published');

-- Verified owners may read all of their own posts, including draft and archived.
DROP POLICY IF EXISTS "Posts: verified owners select own" ON public.posts;
CREATE POLICY "Posts: verified owners select own"
ON public.posts
FOR SELECT
TO authenticated
USING (public.is_verified_business_owner(business_id));

-- 2. Verified business owners may insert for their own verified business only.
DROP POLICY IF EXISTS "Posts: verified owners insert" ON public.posts;
CREATE POLICY "Posts: verified owners insert"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (public.is_verified_business_owner(business_id));

-- 3. Verified business owners may update their own business posts.
DROP POLICY IF EXISTS "Posts: verified owners update" ON public.posts;
CREATE POLICY "Posts: verified owners update"
ON public.posts
FOR UPDATE
TO authenticated
USING (public.is_verified_business_owner(business_id))
WITH CHECK (public.is_verified_business_owner(business_id));

-- 4. Verified business owners may delete their own business posts.
DROP POLICY IF EXISTS "Posts: verified owners delete" ON public.posts;
CREATE POLICY "Posts: verified owners delete"
ON public.posts
FOR DELETE
TO authenticated
USING (public.is_verified_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT ON public.posts TO anon;
GRANT SELECT ON public.posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
