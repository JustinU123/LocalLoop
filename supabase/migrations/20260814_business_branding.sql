-- LocalLoop business branding: profile logo + cover banner only (V1)
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql
--
-- Prerequisite: public "business-images" bucket exists in Supabase Storage (create in dashboard).
-- Object path format: business_id/owner_user_id/{logo|cover}/timestamp-random.ext

-- ---------------------------------------------------------------------------
-- businesses: canonical logo + cover
-- ---------------------------------------------------------------------------

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS logo_storage_path text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS cover_storage_path text;

COMMENT ON COLUMN public.businesses.logo_url IS
  'Public URL for the business profile picture / logo (business-images bucket).';

COMMENT ON COLUMN public.businesses.logo_storage_path IS
  'Storage object path for logo_url; used for replace/delete cleanup.';

COMMENT ON COLUMN public.businesses.cover_image_url IS
  'Public URL for the public profile cover/banner (business-images bucket).';

COMMENT ON COLUMN public.businesses.cover_storage_path IS
  'Storage object path for cover_image_url; used for replace/delete cleanup.';

-- ---------------------------------------------------------------------------
-- business-images storage path helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_verified_business_image_path(object_name text)
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
  kind_folder text;
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

  IF COALESCE(array_length(folders, 1), 0) < 4 THEN
    RETURN false;
  END IF;

  business_folder := folders[1];
  user_folder := folders[2];
  kind_folder := folders[3];
  current_user_id := (select auth.uid())::text;

  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF user_folder IS DISTINCT FROM current_user_id THEN
    RETURN false;
  END IF;

  IF kind_folder NOT IN ('logo', 'cover') THEN
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

COMMENT ON FUNCTION public.is_verified_business_image_path(text) IS
  'True when object_name is business_id/user_id/{logo|cover}/file and the current user owns a verified business with that id.';

REVOKE EXECUTE ON FUNCTION public.is_verified_business_image_path(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_verified_business_image_path(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_verified_business_image_path(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- business-images storage RLS (create-only policies; unique names)
-- Prerequisite: public "business-images" bucket exists.
-- ---------------------------------------------------------------------------

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LocalLoop business-images public read v1"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-images');

CREATE POLICY "LocalLoop business-images verified owners insert v1"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-images'
  AND owner = (select auth.uid())
  AND public.is_verified_business_image_path(name)
);

CREATE POLICY "LocalLoop business-images verified owners update v1"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-images'
  AND owner = (select auth.uid())
  AND public.is_verified_business_image_path(name)
)
WITH CHECK (
  bucket_id = 'business-images'
  AND owner = (select auth.uid())
  AND public.is_verified_business_image_path(name)
);

CREATE POLICY "LocalLoop business-images verified owners delete v1"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-images'
  AND owner = (select auth.uid())
  AND public.is_verified_business_image_path(name)
);
