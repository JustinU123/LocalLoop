-- Allow consumer-facing reads of verified businesses for Explore and public profiles.
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql

DROP POLICY IF EXISTS "Businesses: public read verified" ON public.businesses;
CREATE POLICY "Businesses: public read verified"
ON public.businesses
FOR SELECT
USING (verification_status = 'verified');

GRANT SELECT ON public.businesses TO anon;
