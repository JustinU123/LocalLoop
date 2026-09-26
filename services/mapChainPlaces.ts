import { supabase } from '@/lib/supabase';
import type { MapChainPin } from '@/types/map-pin';
import type {
  MapChainPlacesErrorResponse,
  MapChainPlacesRequest,
  MapChainPlacesSuccessResponse,
} from '@/types/map-chain-places-api';
import type { MapCoordinate } from '@/utils/map-filters';
import type { MapBusinessCategory } from '@/data/map-businesses';

export type FetchMapChainPinsParams = {
  origin: MapCoordinate;
  radiusMiles: number;
  category: MapBusinessCategory;
  openNow: boolean;
};

export type FetchMapChainPinsResult =
  | { ok: true; pins: MapChainPin[] }
  | { ok: false; message: string };

export type DiscoverMapChainPlacesResult =
  | { ok: true; pins: MapChainPin[]; meta: MapChainPlacesSuccessResponse['meta'] }
  | { ok: false; message: string; status?: number };

const MAP_CHAIN_PLACES_FUNCTION = 'map-chain-places';

function isSuccessResponse(data: unknown): data is MapChainPlacesSuccessResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const record = data as MapChainPlacesSuccessResponse;
  return Array.isArray(record.pins) && record.meta?.provider === 'foursquare';
}

function errorMessageFromPayload(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as MapChainPlacesErrorResponse).error;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  return fallback;
}

/**
 * Map layer — invokes `map-chain-places` when Include National Chains is enabled.
 * Category / open-now filters are applied client-side in `mergeAndFilterMapPins`.
 */
export async function fetchMapChainPins(
  params: FetchMapChainPinsParams,
): Promise<FetchMapChainPinsResult> {
  const result = await discoverMapChainPlaces({
    latitude: params.origin.latitude,
    longitude: params.origin.longitude,
    radiusMiles: params.radiusMiles,
  });

  if (result.ok) {
    return { ok: true, pins: result.pins };
  }

  return { ok: false, message: result.message };
}

/**
 * Phase 2 test path — invokes Supabase Edge Function (Foursquare proxy).
 * Does not expose provider credentials to the client.
 */
export async function discoverMapChainPlaces(
  request: MapChainPlacesRequest,
): Promise<DiscoverMapChainPlacesResult> {
  const { data, error } = await supabase.functions.invoke(MAP_CHAIN_PLACES_FUNCTION, {
    body: {
      latitude: request.latitude,
      longitude: request.longitude,
      radiusMiles: request.radiusMiles,
    },
  });

  if (error) {
    return {
      ok: false,
      message: error.message || 'Unable to reach chain places service.',
    };
  }

  if (isSuccessResponse(data)) {
    return { ok: true, pins: data.pins, meta: data.meta };
  }

  return {
    ok: false,
    message: errorMessageFromPayload(data, 'Chain places request failed.'),
  };
}
