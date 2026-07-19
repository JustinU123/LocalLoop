-- Fix post-images storage RLS to match app upload paths safely.
-- Run once after:
--   supabase/migrations/20260720_post_images_storage_policies.sql
--
-- Path format enforced by the app:
--   <business_id>/<authenticated_user_id>/<unique-file-name>.<ext>
--
-- Replaces direct UUID casts inside storage policies with a safe helper that:
-- - validates folder depth via storage.foldername(name)
-- - compares folder 2 to (select auth.uid())::text
-- - reuses public.is_verified_business_owner(uuid) for folder 1

-- ---------------------------------------------------------------------------
-- Safe path helper for post-images storage policies
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_verified_post_image_path(object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  folders text[];
  business_folder text;
  user_folder text;
  current_user_id text;
  business_id uuid;
BEGIN
  IF object_name IS NULL OR pg_catalog.btrim(object_name) = '' THEN
    RETURN false;
  END IF;

  IF left(object_name, 1) = '/' THEN
    RETURN false;
  END IF;

  IF object_name LIKE '%//%' THEN
    RETURN false;
  END IF;

  folders := storage.foldername(object_name);

  IF COALESCE(array_length(folders, 1), 0) < 2 THEN
    RETURN false;
  END IF;

  business_folder := folders[1];
  user_folder := folders[2];
  current_user_id := (select auth.uid())::text;

  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF user_folder IS DISTINCT FROM current_user_id THEN
    RETURN false;
  END IF;

  BEGIN
    business_id := business_folder::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN false;
  END;

  RETURN public.is_verified_business_owner(business_id);
END;
$$;

COMMENT ON FUNCTION public.is_verified_post_image_path(text) IS
  'True when object_name is business_id/user_id/file and the current user owns a verified business with that id.';

REVOKE EXECUTE ON FUNCTION public.is_verified_post_image_path(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_verified_post_image_path(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_verified_post_image_path(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Replace post-images storage policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Post images: public read" ON storage.objects;
CREATE POLICY "Post images: public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Post images: verified owners insert" ON storage.objects;
CREATE POLICY "Post images: verified owners insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND owner = (select auth.uid())
  AND public.is_verified_post_image_path(name)
);

DROP POLICY IF EXISTS "Post images: verified owners update" ON storage.objects;
CREATE POLICY "Post images: verified owners update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND owner = (select auth.uid())
  AND public.is_verified_post_image_path(name)
)
WITH CHECK (
  bucket_id = 'post-images'
  AND owner = (select auth.uid())
  AND public.is_verified_post_image_path(name)
);

DROP POLICY IF EXISTS "Post images: verified owners delete" ON storage.objects;
CREATE POLICY "Post images: verified owners delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND owner = (select auth.uid())
  AND public.is_verified_post_image_path(name)
);
