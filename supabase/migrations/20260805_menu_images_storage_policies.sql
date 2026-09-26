-- LocalLoop storage RLS for menu-images bucket
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql
--
-- Assumes the public bucket "menu-images" already exists in Supabase Storage.
-- Object path format: business_id/user_id/timestamp-random-id.extension

CREATE OR REPLACE FUNCTION public.is_verified_menu_image_path(object_name text)
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

COMMENT ON FUNCTION public.is_verified_menu_image_path(text) IS
  'True when object_name is business_id/user_id/file and the current user owns a verified business with that id.';

REVOKE EXECUTE ON FUNCTION public.is_verified_menu_image_path(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_verified_menu_image_path(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_verified_menu_image_path(text) TO authenticated;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Menu images: public read" ON storage.objects;
CREATE POLICY "Menu images: public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Menu images: verified owners insert" ON storage.objects;
CREATE POLICY "Menu images: verified owners insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
  AND owner = (select auth.uid())
  AND public.is_verified_menu_image_path(name)
);

DROP POLICY IF EXISTS "Menu images: verified owners update" ON storage.objects;
CREATE POLICY "Menu images: verified owners update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND owner = (select auth.uid())
  AND public.is_verified_menu_image_path(name)
)
WITH CHECK (
  bucket_id = 'menu-images'
  AND owner = (select auth.uid())
  AND public.is_verified_menu_image_path(name)
);

DROP POLICY IF EXISTS "Menu images: verified owners delete" ON storage.objects;
CREATE POLICY "Menu images: verified owners delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND owner = (select auth.uid())
  AND public.is_verified_menu_image_path(name)
);
