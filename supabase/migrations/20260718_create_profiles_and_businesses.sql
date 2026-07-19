-- LocalLoop foundation migration: profiles + businesses
-- Run once in the Supabase Dashboard → SQL Editor.
-- Safe to re-run in development: uses IF NOT EXISTS / DROP IF EXISTS where helpful.
-- Does NOT modify auth.users data or delete existing rows.

-- ---------------------------------------------------------------------------
-- Extensions (gen_random_uuid is built-in on Supabase Postgres; no extension needed)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Reusable updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at IS
  'Automatically sets updated_at to now() before INSERT/UPDATE.';

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  account_type text NOT NULL DEFAULT 'explorer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_account_type_check
    CHECK (account_type IN ('explorer', 'business'))
);

COMMENT ON TABLE public.profiles IS
  'One profile row per authenticated user. Created automatically on auth signup.';

COMMENT ON COLUMN public.profiles.account_type IS
  'High-level experience type. Does not by itself grant verified business access.';

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile when a new auth user signs up
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  metadata_account_type text;
  metadata_display_name text;
BEGIN
  metadata_account_type := NEW.raw_user_meta_data ->> 'account_type';
  metadata_display_name := pg_catalog.coalesce(
    pg_catalog.nullif(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'display_name'), ''),
    pg_catalog.nullif(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    pg_catalog.nullif(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'name'), ''),
    pg_catalog.nullif(pg_catalog.split_part(NEW.email, '@', 1), '')
  );

  INSERT INTO public.profiles (id, display_name, account_type)
  VALUES (
    NEW.id,
    metadata_display_name,
    CASE
      WHEN metadata_account_type IN ('explorer', 'business') THEN metadata_account_type
      ELSE 'explorer'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Creates a public.profiles row after auth.users signup. Reads display_name and account_type from user metadata when present.';

-- Restrict direct execution; auth.users trigger still invokes this as SECURITY DEFINER.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  description text,
  phone text,
  email text,
  instagram text,
  website text,
  street_address text,
  city text,
  state text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  verification_status text NOT NULL DEFAULT 'not_submitted',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT businesses_verification_status_check
    CHECK (
      verification_status IN (
        'not_submitted',
        'pending',
        'verified',
        'needs_information',
        'rejected'
      )
    )
);

COMMENT ON TABLE public.businesses IS
  'One business record per owner for now. Verification is enforced in the database, not only in the app.';

COMMENT ON COLUMN public.businesses.owner_user_id IS
  'Unique owner reference. One business per auth user in this foundation schema. The UNIQUE constraint already creates an index; no duplicate index is added.';

COMMENT ON COLUMN public.businesses.verification_status IS
  'Only trusted admin/server processes may set verified. Owners may submit pending applications.';

DROP TRIGGER IF EXISTS businesses_set_updated_at ON public.businesses;

CREATE TRIGGER businesses_set_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Prevent self-verification at the database layer
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_business_verification_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
BEGIN
  -- Allow trusted server/admin contexts to manage verification.
  -- Supabase service role and direct SQL/editor sessions bypass owner restrictions.
  jwt_role := pg_catalog.coalesce(auth.jwt() ->> 'role', '');

  IF jwt_role = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'You may only create a business for your own account.';
    END IF;

    IF NEW.verification_status IN ('verified', 'rejected') THEN
      RAISE EXCEPTION 'Owners cannot create a business with verification_status %.', NEW.verification_status;
    END IF;

    IF NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'Owners cannot set verified_at during business creation.';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
      RAISE EXCEPTION 'Business ownership cannot be transferred by the owner client.';
    END IF;

    -- Owners may never modify verified_at themselves.
    IF NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
      RAISE EXCEPTION 'Only an admin/server process may set verified_at.';
    END IF;

    -- Owners may never set verification to verified or rejected themselves.
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      IF NEW.verification_status = 'verified' THEN
        RAISE EXCEPTION 'Owners cannot set verification_status to verified.';
      END IF;

      IF NEW.verification_status = 'rejected' THEN
        RAISE EXCEPTION 'Owners cannot set verification_status to rejected.';
      END IF;

      -- Allow owners to move their application through review states only.
      IF NEW.verification_status NOT IN ('not_submitted', 'pending', 'needs_information') THEN
        RAISE EXCEPTION 'Invalid verification_status change for owner update.';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_business_verification_rules IS
  'Blocks normal authenticated users from self-verifying or editing verified_at. Admin/service-role updates are allowed.';

DROP TRIGGER IF EXISTS businesses_enforce_verification_rules ON public.businesses;

CREATE TRIGGER businesses_enforce_verification_rules
BEFORE INSERT OR UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.enforce_business_verification_rules();

-- ---------------------------------------------------------------------------
-- Helper for future Post / Storage policies
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_verified_business_owner(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = target_business_id
      AND b.owner_user_id = auth.uid()
      AND b.verification_status = 'verified'
  );
$$;

COMMENT ON FUNCTION public.is_verified_business_owner(uuid) IS
  'Returns true when the current auth user owns the business and it is verified. Use in future RLS policies.';

REVOKE EXECUTE ON FUNCTION public.is_verified_business_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_verified_business_owner(uuid) FROM anon;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Profiles: no client INSERT policy on purpose.
-- New profiles are created by the auth.users signup trigger above.

DROP POLICY IF EXISTS "Profiles: select own row" ON public.profiles;
CREATE POLICY "Profiles: select own row"
ON public.profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Profiles: update own row" ON public.profiles;
CREATE POLICY "Profiles: update own row"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Businesses: select own row" ON public.businesses;
CREATE POLICY "Businesses: select own row"
ON public.businesses
FOR SELECT
TO authenticated
USING (owner_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Businesses: insert own row" ON public.businesses;
CREATE POLICY "Businesses: insert own row"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (
  owner_user_id = (select auth.uid())
  AND verification_status <> 'verified'
  AND verified_at IS NULL
);

DROP POLICY IF EXISTS "Businesses: update own row" ON public.businesses;
CREATE POLICY "Businesses: update own row"
ON public.businesses
FOR UPDATE
TO authenticated
USING (owner_user_id = (select auth.uid()))
WITH CHECK (owner_user_id = (select auth.uid()));

-- Intentionally NO public SELECT policy on businesses yet.
-- Consumer-facing business reads can be added later with a safe view or policy.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.businesses TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_verified_business_owner(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Backfill profiles for auth users created before this migration
-- Idempotent: safe to run more than once.
-- ---------------------------------------------------------------------------

INSERT INTO public.profiles (id, display_name, account_type)
SELECT
  u.id,
  pg_catalog.coalesce(
    pg_catalog.nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    pg_catalog.nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    pg_catalog.nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'name'), ''),
    pg_catalog.nullif(pg_catalog.split_part(u.email, '@', 1), '')
  ),
  CASE
    WHEN u.raw_user_meta_data ->> 'account_type' IN ('explorer', 'business')
      THEN u.raw_user_meta_data ->> 'account_type'
    ELSE 'explorer'
  END
FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;
