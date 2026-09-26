import type { MapBusiness, MapBusinessCategory } from '@/data/map-businesses';

/** Verified LocalLoop business from Supabase — never a national chain POI. */
export type MapLocalPin = {
  kind: 'localloop';
  id: string;
  profileId: string;
  name: string;
  category: string;
  mapCategory: MapBusinessCategory;
  keywords: string[];
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  image: string;
  logo: string;
  isLocalLoopMember: true;
  isChain: false;
  hasPromotion: boolean;
  isOpen: boolean;
  description?: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
};

/**
 * External national-chain POI (Google, Foursquare, etc.).
 * Not stored in public.businesses; no LocalLoop social/commerce features.
 */
export type MapChainPin = {
  kind: 'chain';
  /** Client-stable key, e.g. `chain:${placeId}` */
  id: string;
  /** Provider place identifier (Google `places/…`, Foursquare `fsq_place_id`, etc.) */
  placeId: string;
  provider: 'google' | 'foursquare' | 'unknown';
  name: string;
  category: string;
  /** Foursquare primary matched category id (Places OS taxonomy). */
  fsqCategoryId?: string;
  mapCategory: MapBusinessCategory;
  keywords: string[];
  latitude: number;
  longitude: number;
  isChain: true;
  isLocalLoopMember: false;
  hasPromotion: false;
  isOpen: boolean;
  formattedAddress?: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  /** Provider-backed fields loaded on demand in later phases */
  phone?: string;
  website?: string;
  hoursSummary?: string;
  providerMapsUri?: string;
};

export type MapPin = MapLocalPin | MapChainPin;

export type MapPinWithDistance = MapPin & {
  distanceMiles: number;
  distanceLabel: string;
};

export type MapLocalPinWithDistance = MapLocalPin & {
  distanceMiles: number;
  distanceLabel: string;
};

export type MapChainPinWithDistance = MapChainPin & {
  distanceMiles: number;
  distanceLabel: string;
};

export function isMapLocalPin(pin: MapPin): pin is MapLocalPin {
  return pin.kind === 'localloop';
}

export function isMapChainPin(pin: MapPin): pin is MapChainPin {
  return pin.kind === 'chain';
}

export function isMapLocalPinWithDistance(pin: MapPinWithDistance): pin is MapLocalPinWithDistance {
  return pin.kind === 'localloop';
}

export function isMapChainPinWithDistance(pin: MapPinWithDistance): pin is MapChainPinWithDistance {
  return pin.kind === 'chain';
}

/** Reserved for Phase 4+ chain detail / preview (no delivery integration yet). */
export type MapChainDeliveryProviderId = 'uber_eats' | 'doordash';

export type MapChainDeliveryLink = {
  provider: MapChainDeliveryProviderId;
  /** Deep link when partnerships exist; unset in Phase 1–3 */
  url?: string;
  status: 'placeholder' | 'available';
};

export type MapChainPinDetails = MapChainPin & {
  delivery?: {
    sectionTitle: string;
    links: MapChainDeliveryLink[];
  };
};
