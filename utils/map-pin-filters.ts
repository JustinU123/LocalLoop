import type { MapBusinessCategory } from '@/data/map-businesses';
import type {
  MapChainPin,
  MapLocalPin,
  MapPin,
  MapPinWithDistance,
} from '@/types/map-pin';
import { isMapChainPin, isMapLocalPin } from '@/types/map-pin';

import type { MapCoordinate, MapFilters } from '@/utils/map-filters';
import { formatMapDistance, getDistanceMiles } from '@/utils/map-filters';

const LOCAL_COLLISION_RADIUS_MILES = 0.03;

function matchesSearchQuery(pin: MapPin, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [pin.name, pin.category, ...pin.keywords].join(' ').toLowerCase();
  return haystack.includes(normalized);
}

function withDistance(origin: MapCoordinate, pin: MapPin): MapPinWithDistance {
  const distanceMiles = getDistanceMiles(origin, {
    latitude: pin.latitude,
    longitude: pin.longitude,
  });

  return {
    ...pin,
    distanceMiles,
    distanceLabel: formatMapDistance(distanceMiles),
  };
}

function filterLocalPins(
  localPins: MapLocalPin[],
  origin: MapCoordinate,
  query: string,
  filters: MapFilters,
): MapPinWithDistance[] {
  let results = localPins
    .filter((pin) =>
      filters.category === 'all' ? true : pin.mapCategory === filters.category,
    )
    .filter((pin) => matchesSearchQuery(pin, query))
    .filter((pin) => (filters.openNow ? pin.isOpen : true))
    .filter((pin) => (filters.hasPromotions ? pin.hasPromotion : true))
    .filter((pin) => (filters.onLocalLoop ? pin.isLocalLoopMember : true))
    .map((pin) => withDistance(origin, pin))
    .filter((pin) => pin.distanceMiles <= filters.distanceMiles);

  if (filters.highestRated) {
    results = [...results].sort((a, b) => {
      if (!isMapLocalPin(a) || !isMapLocalPin(b)) {
        return 0;
      }
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    });
  }

  return results;
}

function filterChainPins(
  chainPins: MapChainPin[],
  origin: MapCoordinate,
  query: string,
  filters: MapFilters,
): MapPinWithDistance[] {
  if (filters.hasPromotions || filters.onLocalLoop) {
    return [];
  }

  const seenPlaceIds = new Set<string>();

  return chainPins
    .filter((pin) => {
      if (seenPlaceIds.has(pin.placeId)) {
        return false;
      }
      seenPlaceIds.add(pin.placeId);
      return true;
    })
    .filter((pin) =>
      filters.category === 'all' ? true : pin.mapCategory === filters.category,
    )
    .filter((pin) => matchesSearchQuery(pin, query))
    .filter((pin) => (filters.openNow ? pin.isOpen : true))
    .map((pin) => withDistance(origin, pin))
    .filter((pin) => pin.distanceMiles <= filters.distanceMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

/** Drop chain POIs that sit on top of a LocalLoop business (locals win). */
export function dedupeChainPinsAgainstLocals(
  localPins: MapPinWithDistance[],
  chainPins: MapPinWithDistance[],
): MapPinWithDistance[] {
  return chainPins.filter((chain) => {
    return !localPins.some((local) => {
      if (!isMapLocalPin(local)) {
        return false;
      }
      const miles = getDistanceMiles(
        { latitude: local.latitude, longitude: local.longitude },
        { latitude: chain.latitude, longitude: chain.longitude },
      );
      return miles <= LOCAL_COLLISION_RADIUS_MILES;
    });
  });
}

export function mergeAndFilterMapPins({
  localPins,
  chainPins,
  origin,
  query,
  filters,
}: {
  localPins: MapLocalPin[];
  chainPins: MapChainPin[];
  origin: MapCoordinate;
  query: string;
  filters: MapFilters;
}): MapPinWithDistance[] {
  const filteredLocals = filterLocalPins(localPins, origin, query, filters);

  if (!filters.includeChains) {
    return filteredLocals;
  }

  const filteredChains = dedupeChainPinsAgainstLocals(
    filteredLocals,
    filterChainPins(chainPins, origin, query, filters),
  );

  if (filteredChains.length === 0) {
    return filteredLocals;
  }

  if (filters.highestRated) {
    return [...filteredLocals, ...filteredChains];
  }

  return [...filteredLocals, ...filteredChains].sort(
    (a, b) => a.distanceMiles - b.distanceMiles,
  );
}

export function countLocalPinsOnMap(pins: MapPinWithDistance[]): number {
  return pins.filter((pin) => pin.kind === 'localloop').length;
}
