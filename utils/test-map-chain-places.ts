import { DEFAULT_MAP_CENTER } from '@/data/map-businesses';
import { discoverMapChainPlaces } from '@/services/mapChainPlaces';

export type TestMapChainPlacesResult = Awaited<ReturnType<typeof discoverMapChainPlaces>>;

/**
 * Dev-only helper to verify Foursquare → Edge Function → MapChainPin normalization.
 * Does not touch the map UI.
 */
export async function testMapChainPlacesDiscovery(options?: {
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
}): Promise<TestMapChainPlacesResult> {
  const latitude = options?.latitude ?? DEFAULT_MAP_CENTER.latitude;
  const longitude = options?.longitude ?? DEFAULT_MAP_CENTER.longitude;
  const radiusMiles = options?.radiusMiles ?? 15;

  const result = await discoverMapChainPlaces({ latitude, longitude, radiusMiles });

  if (__DEV__) {
    if (result.ok) {
      console.info('[testMapChainPlacesDiscovery] success', {
        count: result.meta.count,
        providerResultCount: result.meta.providerResultCount,
        afterChainFilterCount: result.meta.afterChainFilterCount,
        radiusMeters: result.meta.radiusMeters,
        foursquareSearchParams: result.meta.foursquareSearchParams,
        latitude,
        longitude,
        radiusMiles,
      });

      for (const pin of result.pins) {
        console.info('[testMapChainPlacesDiscovery] pin', {
          name: pin.name,
          category: pin.category,
          fsqCategoryId: pin.fsqCategoryId ?? '(none)',
          mapCategory: pin.mapCategory,
        });
      }

      const names = result.pins.map((pin) => pin.name.toLowerCase());
      const hasJenis = names.some((n) => n.includes('jeni'));
      const hasTraderJoes = names.some((n) => n.includes('trader joe'));
      const hasAmoeba = names.some((n) => n.includes('amoeba'));
      console.info('[testMapChainPlacesDiscovery] filter spot-check', {
        hasJenis,
        hasTraderJoes,
        hasAmoeba,
        expect: { hasJenis: true, hasTraderJoes: false, hasAmoeba: false },
      });
    } else {
      console.error('[testMapChainPlacesDiscovery] failed', result.message);
    }
  }

  return result;
}
