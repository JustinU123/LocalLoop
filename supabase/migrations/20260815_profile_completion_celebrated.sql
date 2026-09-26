-- One-time Dashboard profile completion celebration (per business).
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS profile_completion_celebrated_at timestamptz;

COMMENT ON COLUMN public.businesses.profile_completion_celebrated_at IS
  'When the owner first reached 100% profile completeness and saw the Dashboard celebration. NULL until acknowledged. Owner-writable; not exposed on public reads.';
