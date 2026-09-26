import tzlookup from '@photostructure/tz-lookup';
import * as Location from 'expo-location';

const IANA_TIMEZONE_PATTERN = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$/;

export type ResolveBusinessTimezoneResult =
  | { ok: true; timezone: string; source: 'reverse_geocode' | 'coordinate_lookup' }
  | { ok: false; reason: 'invalid_coordinates' | 'no_timezone' | 'failed' };

export function isValidIanaTimezone(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 64) {
    return false;
  }

  return IANA_TIMEZONE_PATTERN.test(trimmed);
}

export function resolveTimezoneFromCoordinateLookup(
  latitude: number,
  longitude: number,
): string | null {
  try {
    const timezone = tzlookup(latitude, longitude);
    return isValidIanaTimezone(timezone) ? timezone.trim() : null;
  } catch (error) {
    if (__DEV__) {
      console.warn('[resolveTimezoneFromCoordinateLookup]', error);
    }
    return null;
  }
}

/**
 * Derives an IANA timezone from business coordinates:
 * 1) Expo reverse geocode when the platform returns `timezone`
 * 2) Offline lat/lng lookup (@photostructure/tz-lookup)
 */
export async function resolveBusinessTimezoneFromCoordinates(
  latitude: number | null,
  longitude: number | null,
): Promise<ResolveBusinessTimezoneResult> {
  if (
    latitude === null ||
    longitude === null ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return { ok: false, reason: 'invalid_coordinates' };
  }

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    const candidate = results[0]?.timezone?.trim();
    if (candidate && isValidIanaTimezone(candidate)) {
      return { ok: true, timezone: candidate, source: 'reverse_geocode' };
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[resolveBusinessTimezoneFromCoordinates:reverseGeocode]', error);
    }
  }

  const offlineTimezone = resolveTimezoneFromCoordinateLookup(latitude, longitude);
  if (offlineTimezone) {
    return { ok: true, timezone: offlineTimezone, source: 'coordinate_lookup' };
  }

  return { ok: false, reason: 'no_timezone' };
}
