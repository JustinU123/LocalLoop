-- Weekly structured business hours on public.businesses
-- Run once after supabase/migrations/20260718_create_profiles_and_businesses.sql
-- DO NOT apply to remote until reviewed.

-- ---------------------------------------------------------------------------
-- Default: all days closed, no intervals
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.default_weekly_business_hours()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'monday', jsonb_build_object('closed', true, 'intervals', '[]'::jsonb),
    'tuesday', jsonb_build_object('closed', true, 'intervals', '[]'::jsonb),
    'wednesday', jsonb_build_object('closed', true, 'intervals', '[]'::jsonb),
    'thursday', jsonb_build_object('closed', true, 'intervals', '[]'::jsonb),
    'friday', jsonb_build_object('closed', true, 'intervals', '[]'::jsonb),
    'saturday', jsonb_build_object('closed', true, 'intervals', '[]'::jsonb),
    'sunday', jsonb_build_object('closed', true, 'intervals', '[]'::jsonb)
  );
$$;

COMMENT ON FUNCTION public.default_weekly_business_hours IS
  'Default owner schedule: seven weekday keys, each closed with an empty intervals array.';

-- ---------------------------------------------------------------------------
-- Validation helpers (wall-clock HH:MM, local business time — not UTC)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_valid_wall_clock_time(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT value ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$';
$$;

CREATE OR REPLACE FUNCTION public.is_valid_business_day_hours(day_value jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  is_closed boolean;
  intervals jsonb;
  entry jsonb;
  open_time text;
  close_time text;
  interval_count integer;
BEGIN
  IF day_value IS NULL OR jsonb_typeof(day_value) <> 'object' THEN
    RETURN false;
  END IF;

  IF NOT (day_value ? 'closed') OR jsonb_typeof(day_value -> 'closed') <> 'boolean' THEN
    RETURN false;
  END IF;

  is_closed := (day_value ->> 'closed')::boolean;

  IF NOT (day_value ? 'intervals') OR jsonb_typeof(day_value -> 'intervals') <> 'array' THEN
    RETURN false;
  END IF;

  intervals := day_value -> 'intervals';
  interval_count := jsonb_array_length(intervals);

  IF interval_count > 8 THEN
    RETURN false;
  END IF;

  IF is_closed THEN
    RETURN interval_count = 0;
  END IF;

  IF interval_count < 1 THEN
    RETURN false;
  END IF;

  FOR entry IN SELECT value FROM jsonb_array_elements(intervals) AS value LOOP
    IF jsonb_typeof(entry) <> 'object' THEN
      RETURN false;
    END IF;

    open_time := entry ->> 'open';
    close_time := entry ->> 'close';

    IF open_time IS NULL OR close_time IS NULL THEN
      RETURN false;
    END IF;

    IF NOT public.is_valid_wall_clock_time(open_time)
       OR NOT public.is_valid_wall_clock_time(close_time) THEN
      RETURN false;
    END IF;

    -- Zero-length intervals are invalid. Overnight intervals (close <= open) are allowed.
    IF open_time = close_time THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_weekly_business_hours(value jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  day_key text;
BEGIN
  IF value IS NULL OR jsonb_typeof(value) <> 'object' THEN
    RETURN false;
  END IF;

  FOREACH day_key IN ARRAY ARRAY[
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ] LOOP
    IF NOT (value ? day_key) THEN
      RETURN false;
    END IF;

    IF NOT public.is_valid_business_day_hours(value -> day_key) THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.is_valid_weekly_business_hours(jsonb) IS
  'Validates weekly_hours JSON: seven day keys, closed flag, up to 8 HH:MM intervals per open day. Overlap checks are enforced in the app.';

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS weekly_hours jsonb NOT NULL DEFAULT public.default_weekly_business_hours();

COMMENT ON COLUMN public.businesses.timezone IS
  'IANA timezone for wall-clock hours (e.g. America/Los_Angeles). Set automatically from business latitude/longitude via reverse geocode (and an approved offline lat/lng fallback when needed). Owners do not type this value. Open-now logic must use this column only — never the viewer device timezone. NULL only during backfill or when coordinates are missing; consumer Open Now must treat NULL as unknown/closed until resolved.';

COMMENT ON COLUMN public.businesses.weekly_hours IS
  'Structured weekly hours. Each day: { "closed": boolean, "intervals": [{ "open": "HH:MM", "close": "HH:MM" }] }. Times are local wall clock. If close <= open, the interval crosses midnight into the next calendar day.';

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_weekly_hours_valid;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_weekly_hours_valid
  CHECK (public.is_valid_weekly_business_hours(weekly_hours));

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_timezone_format;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_timezone_format
  CHECK (
    timezone IS NULL
    OR (
      char_length(timezone) BETWEEN 3 AND 64
      AND timezone ~ '^[A-Za-z_]+/[A-Za-z0-9_+-]+$'
    )
  );
