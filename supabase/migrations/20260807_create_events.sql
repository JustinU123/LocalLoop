-- LocalLoop events for verified business profiles
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'published',
  image_url text,
  event_name text NOT NULL,
  description text NOT NULL,
  event_date date NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  is_multi_day boolean NOT NULL DEFAULT false,
  end_date date,
  location_type text NOT NULL DEFAULT 'business',
  venue_name text,
  street_address text,
  city text,
  state text,
  postal_code text,
  event_link text,
  ticket_type text NOT NULL DEFAULT 'free',
  price_cents integer,
  ticket_link text,
  rsvp_link text,
  capacity integer,
  age_requirement text,
  custom_age_requirement text,
  contact_name text,
  contact_phone text,
  contact_email text,
  additional_information text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_status_check
    CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT events_location_type_check
    CHECK (location_type IN ('business', 'different', 'online')),
  CONSTRAINT events_ticket_type_check
    CHECK (ticket_type IN ('free', 'paid', 'rsvp')),
  CONSTRAINT events_age_requirement_check
    CHECK (
      age_requirement IS NULL
      OR age_requirement IN ('all-ages', '18+', '21+', 'custom')
    )
);

COMMENT ON TABLE public.events IS
  'Published in-person and online events for verified business profiles.';

DROP TRIGGER IF EXISTS events_set_updated_at ON public.events;

CREATE TRIGGER events_set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS events_business_id_idx
  ON public.events (business_id);

CREATE INDEX IF NOT EXISTS events_status_idx
  ON public.events (status);

CREATE INDEX IF NOT EXISTS events_start_at_idx
  ON public.events (start_at ASC);

CREATE INDEX IF NOT EXISTS events_business_status_start_idx
  ON public.events (business_id, status, start_at ASC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events: public read published" ON public.events;
CREATE POLICY "Events: public read published"
ON public.events
FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "Events: verified owners select own" ON public.events;
CREATE POLICY "Events: verified owners select own"
ON public.events
FOR SELECT
TO authenticated
USING (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Events: verified owners insert" ON public.events;
CREATE POLICY "Events: verified owners insert"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Events: verified owners update" ON public.events;
CREATE POLICY "Events: verified owners update"
ON public.events
FOR UPDATE
TO authenticated
USING (public.is_verified_business_owner(business_id))
WITH CHECK (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Events: verified owners delete" ON public.events;
CREATE POLICY "Events: verified owners delete"
ON public.events
FOR DELETE
TO authenticated
USING (public.is_verified_business_owner(business_id));

GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
