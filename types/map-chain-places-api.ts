import type { MapChainPin } from '@/types/map-pin';

/** POST body for the `map-chain-places` Edge Function. */
export type MapChainPlacesRequest = {
  latitude: number;
  longitude: number;
  /** Search radius in miles (server-clamped). */
  radiusMiles: number;
};

export type MapChainPlacesMeta = {
  provider: 'foursquare';
  count: number;
  radiusMeters: number;
  limit: number;
  /** Foursquare query params sent to Places Search (no credentials). */
  foursquareSearchParams?: Record<string, string>;
  /** Raw result count from Foursquare before client-side filters. */
  providerResultCount?: number;
  /** Places with non-empty `chains` before food category validation. */
  afterChainFilterCount?: number;
};

export type MapChainPlacesSuccessResponse = {
  pins: MapChainPin[];
  meta: MapChainPlacesMeta;
};

export type MapChainPlacesErrorResponse = {
  error: string;
  code?: 'invalid_input' | 'misconfigured' | 'provider_error' | 'method_not_allowed';
};
