import type { MapBusiness, MapBusinessCategory, MapDistanceOption } from '@/data/map-businesses';

export type MapFilters = {
  includeChains: boolean;
  category: MapBusinessCategory;
  distanceMiles: MapDistanceOption;
  openNow: boolean;
  highestRated: boolean;
  hasPromotions: boolean;
  onLocalLoop: boolean;
};

export const DEFAULT_MAP_FILTERS: MapFilters = {
  includeChains: false,
  category: 'all',
  distanceMiles: 15,
  openNow: false,
  highestRated: false,
  hasPromotions: false,
  onLocalLoop: false,
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export function getDistanceMiles(
  origin: MapCoordinate,
  target: MapCoordinate,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(target.latitude - origin.latitude);
  const lonDelta = toRadians(target.longitude - origin.longitude);
  const originLat = toRadians(origin.latitude);
  const targetLat = toRadians(target.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(lonDelta / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatMapDistance(miles: number): string {
  if (miles < 0.1) return 'Nearby';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function matchesSearchQuery(business: MapBusiness, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    business.name,
    business.category,
    ...business.keywords,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized);
}

export type MapBusinessWithDistance = MapBusiness & {
  distanceMiles: number;
  distanceLabel: string;
};

/** @see mergeAndFilterMapPins in `@/utils/map-pin-filters` for local + chain map pins */

export function filterMapBusinesses({
  businesses,
  origin,
  query,
  filters,
}: {
  businesses: MapBusiness[];
  origin: MapCoordinate;
  query: string;
  filters: MapFilters;
}): MapBusinessWithDistance[] {
  let results = businesses
    .filter((business) => (filters.includeChains ? true : !business.isChain))
    .filter((business) =>
      filters.category === 'all' ? true : business.mapCategory === filters.category,
    )
    .filter((business) => matchesSearchQuery(business, query))
    .filter((business) => (filters.openNow ? business.isOpen : true))
    .filter((business) => (filters.hasPromotions ? business.hasPromotion : true))
    .filter((business) => (filters.onLocalLoop ? business.isLocalLoopMember : true))
    .map((business) => {
      const distanceMiles = getDistanceMiles(origin, {
        latitude: business.latitude,
        longitude: business.longitude,
      });

      return {
        ...business,
        distanceMiles,
        distanceLabel: formatMapDistance(distanceMiles),
      };
    })
    .filter((business) => business.distanceMiles <= filters.distanceMiles);

  if (filters.highestRated) {
    results = [...results].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  }

  return results;
}

export function regionsAreDifferent(
  current: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number },
  baseline: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number },
): boolean {
  const latShift = Math.abs(current.latitude - baseline.latitude);
  const lonShift = Math.abs(current.longitude - baseline.longitude);
  const deltaShift =
    Math.abs(current.latitudeDelta - baseline.latitudeDelta) +
    Math.abs(current.longitudeDelta - baseline.longitudeDelta);

  return latShift > 0.01 || lonShift > 0.01 || deltaShift > 0.02;
}
