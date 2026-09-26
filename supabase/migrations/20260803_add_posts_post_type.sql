-- Extend public.posts to support text announcements alongside photo posts.
-- Run once after supabase/migrations/20260719_create_posts.sql

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'photo';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_post_type_check
  CHECK (post_type IN ('photo', 'announcement'));

COMMENT ON COLUMN public.posts.post_type IS
  'Discriminator for feed rendering: photo (image posts) or announcement (text-only).';

CREATE INDEX IF NOT EXISTS posts_post_type_idx
  ON public.posts (post_type);
