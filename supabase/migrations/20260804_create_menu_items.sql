-- LocalLoop menu items for verified business profiles
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  image_url text NOT NULL,
  price_cents integer,
  price_varies boolean NOT NULL DEFAULT false,
  availability_status text NOT NULL DEFAULT 'available-now',
  available_date date,
  is_limited_time boolean NOT NULL DEFAULT false,
  limited_time_start_date date,
  limited_time_end_date date,
  dietary_tags text[] NOT NULL DEFAULT '{}',
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  additional_information text,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT menu_items_status_check
    CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT menu_items_availability_check
    CHECK (
      availability_status IN (
        'available-now',
        'coming-soon',
        'limited-availability',
        'sold-out'
      )
    )
);

COMMENT ON TABLE public.menu_items IS
  'Published menu items displayed on verified business profiles.';

DROP TRIGGER IF EXISTS menu_items_set_updated_at ON public.menu_items;

CREATE TRIGGER menu_items_set_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS menu_items_business_id_idx
  ON public.menu_items (business_id);

CREATE INDEX IF NOT EXISTS menu_items_category_idx
  ON public.menu_items (category);

CREATE INDEX IF NOT EXISTS menu_items_created_at_desc_idx
  ON public.menu_items (created_at DESC);

CREATE INDEX IF NOT EXISTS menu_items_status_idx
  ON public.menu_items (status);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Menu items: public read published" ON public.menu_items;
CREATE POLICY "Menu items: public read published"
ON public.menu_items
FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "Menu items: verified owners select own" ON public.menu_items;
CREATE POLICY "Menu items: verified owners select own"
ON public.menu_items
FOR SELECT
TO authenticated
USING (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Menu items: verified owners insert" ON public.menu_items;
CREATE POLICY "Menu items: verified owners insert"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Menu items: verified owners update" ON public.menu_items;
CREATE POLICY "Menu items: verified owners update"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (public.is_verified_business_owner(business_id))
WITH CHECK (public.is_verified_business_owner(business_id));

DROP POLICY IF EXISTS "Menu items: verified owners delete" ON public.menu_items;
CREATE POLICY "Menu items: verified owners delete"
ON public.menu_items
FOR DELETE
TO authenticated
USING (public.is_verified_business_owner(business_id));

GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT ON public.menu_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
