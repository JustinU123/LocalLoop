import * as Location from 'expo-location';

export type GeocodeBusinessAddressResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: 'empty_query' | 'no_results' | 'failed' };

/**
 * Forward-geocodes a mailing address using the device platform geocoder (expo-location).
 * No third-party API key is required on iOS/Android; accuracy depends on Apple/Google geocoding.
 */
export async function geocodeBusinessAddress(query: string): Promise<GeocodeBusinessAddressResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty_query' };
  }

  try {
    const results = await Location.geocodeAsync(trimmed);
    const first = results[0];

    if (!first || first.latitude === undefined || first.longitude === undefined) {
      return { ok: false, reason: 'no_results' };
    }

    return {
      ok: true,
      latitude: first.latitude,
      longitude: first.longitude,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[geocodeBusinessAddress]', error);
    }
    return { ok: false, reason: 'failed' };
  }
}
