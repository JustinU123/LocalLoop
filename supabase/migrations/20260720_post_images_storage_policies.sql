-- LocalLoop storage RLS for post-images bucket
-- Run once after:
--   supabase/migrations/20260718_create_profiles_and_businesses.sql
--
-- Assumes the public bucket "post-images" already exists in Supabase Storage.
-- Object path format: business_id/user_id/timestamp-random-id.extension

-- ---------------------------------------------------------------------------
-- Row Level Security on storage.objects
-- ---------------------------------------------------------------------------

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Public read access for the post-images bucket (public URLs).
DROP POLICY IF EXISTS "Post images: public read" ON storage.objects;
CREATE POLICY "Post images: public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');

-- 2. Verified business owners may upload into their own business/user folder only.
DROP POLICY IF EXISTS "Post images: verified owners insert" ON storage.objects;
CREATE POLICY "Post images: verified owners insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[2] = (select auth.uid())::text
  AND EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = ((storage.foldername(name))[1])::uuid
      AND b.owner_user_id = (select auth.uid())
      AND b.verification_status = 'verified'
  )
);

-- 3. Verified business owners may update files in their own business/user folder.
DROP POLICY IF EXISTS "Post images: verified owners update" ON storage.objects;
CREATE POLICY "Post images: verified owners update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[2] = (select auth.uid())::text
  AND EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = ((storage.foldername(name))[1])::uuid
      AND b.owner_user_id = (select auth.uid())
      AND b.verification_status = 'verified'
  )
)
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[2] = (select auth.uid())::text
  AND EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = ((storage.foldername(name))[1])::uuid
      AND b.owner_user_id = (select auth.uid())
      AND b.verification_status = 'verified'
  )
);

-- 4. Verified business owners may delete files in their own business/user folder.
DROP POLICY IF EXISTS "Post images: verified owners delete" ON storage.objects;
CREATE POLICY "Post images: verified owners delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[2] = (select auth.uid())::text
  AND EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = ((storage.foldername(name))[1])::uuid
      AND b.owner_user_id = (select auth.uid())
      AND b.verification_status = 'verified'
  )
);
