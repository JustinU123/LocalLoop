import { supabase } from '@/lib/supabase';
import { getActivePromotionBusinessIds } from '@/services/promotions';
import type { MapBusiness, MapBusinessCategory } from '@/data/map-businesses';
import {
  resolveBusinessCoverUrl,
  resolveBusinessLogoUrl,
} from '@/utils/business-branding-display';

export type MapBusinessesErrorCode = 'network' | 'unexpected';

export type GetMapBusinessesResult =
  | { ok: true; businesses: MapBusiness[] }
  | { ok: false; code: MapBusinessesErrorCode; message: string };

const MAP_BUSINESS_SELECT =
  'id, name, category, description, street_address, city, state, postal_code, latitude, longitude, logo_url, cover_image_url';

type MapBusinessRow = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  cover_image_url: string | null;
};

function coerceCoordinate(value: number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

type PublishedPostRow = {
  business_id: string;
  image_url: string | null;
  created_at: string;
};

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[mapBusinesses:${scope}]`, error);
  }
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  return /network request failed|failed to fetch|network error/i.test(message);
}

export function hasValidMapCoordinates(latitude: number | null, longitude: number | null): boolean {
  if (latitude === null || longitude === null) {
    return false;
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return false;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }

  if (latitude === 0 && longitude === 0) {
    return false;
  }

  return true;
}

export function inferMapCategory(category: string | null): MapBusinessCategory {
  const lower = (category ?? '').trim().toLowerCase();

  if (
    lower.includes('coffee') ||
    lower.includes('cafe') ||
    lower.includes('espresso')
  ) {
    return 'coffee';
  }

  if (lower.includes('bakery') || lower.includes('pastry') || lower.includes('bread')) {
    return 'bakery';
  }

  if (
    lower.includes('food') ||
    lower.includes('restaurant') ||
    lower.includes('taco') ||
    lower.includes('pizza') ||
    lower.includes('kitchen')
  ) {
    return 'food';
  }

  if (
    lower.includes('cloth') ||
    lower.includes('boutique') ||
    lower.includes('vintage') ||
    lower.includes('apparel')
  ) {
    return 'clothing';
  }

  if (lower.includes('market') || lower.includes('grocery') || lower.includes('produce')) {
    return 'markets';
  }

  if (
    lower.includes('beauty') ||
    lower.includes('salon') ||
    lower.includes('barber') ||
    lower.includes('spa')
  ) {
    return 'beauty';
  }

  if (lower.includes('book')) {
    return 'books';
  }

  if (lower.includes('florist') || lower.includes('flower')) {
    return 'florists';
  }

  if (
    lower.includes('fitness') ||
    lower.includes('gym') ||
    lower.includes('yoga') ||
    lower.includes('pilates')
  ) {
    return 'fitness';
  }

  return 'other';
}

function buildKeywords(row: MapBusinessRow): string[] {
  return [row.name, row.category, row.street_address, row.city, row.state, row.postal_code]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function mapRowToMapBusiness(
  row: MapBusinessRow,
  coverImageUrl: string | null,
  hasActivePromotion: boolean,
): MapBusiness | null {
  const latitude = coerceCoordinate(row.latitude);
  const longitude = coerceCoordinate(row.longitude);

  if (!hasValidMapCoordinates(latitude, longitude)) {
    return null;
  }

  const categoryLabel = row.category?.trim() || 'Local Business';
  const legacyPostImage = coverImageUrl?.trim() || null;
  const logo = resolveBusinessLogoUrl({
    logoUrl: row.logo_url,
    legacyFallback: legacyPostImage,
  });
  const image = resolveBusinessCoverUrl({
    coverUrl: row.cover_image_url,
    logoUrl: row.logo_url,
    legacyFallback: legacyPostImage,
  });

  return {
    id: row.id,
    profileId: row.id,
    name: row.name,
    category: categoryLabel,
    mapCategory: inferMapCategory(row.category),
    keywords: buildKeywords(row),
    latitude: latitude as number,
    longitude: longitude as number,
    rating: 0,
    reviewCount: 0,
    image,
    logo,
    streetAddress: row.street_address?.trim() || null,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code?.trim() || null,
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: hasActivePromotion,
    isOpen: false,
    description: row.description?.trim() || undefined,
  };
}

async function attachCoverImages(rows: MapBusinessRow[]): Promise<Map<string, string>> {
  if (rows.length === 0) {
    return new Map();
  }

  const businessIds = rows.map((row) => row.id);

  const { data, error } = await supabase
    .from('posts')
    .select('business_id, image_url, created_at')
    .eq('status', 'published')
    .not('image_url', 'is', null)
    .in('business_id', businessIds)
    .order('created_at', { ascending: false });

  if (error) {
    logDevError('attachCoverImages.posts', error);
    return new Map();
  }

  const latestImageByBusiness = new Map<string, string>();

  for (const post of (data as PublishedPostRow[] | null) ?? []) {
    if (!post.image_url || latestImageByBusiness.has(post.business_id)) {
      continue;
    }
    latestImageByBusiness.set(post.business_id, post.image_url);
  }

  return latestImageByBusiness;
}

export async function getMapBusinesses(): Promise<GetMapBusinessesResult> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(MAP_BUSINESS_SELECT)
      .eq('verification_status', 'verified')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      logDevError('getMapBusinesses', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load businesses for the map right now.',
      };
    }

    const rows = (data as MapBusinessRow[] | null) ?? [];
    const [coverImages, activePromotionIdsResult] = await Promise.all([
      attachCoverImages(rows),
      getActivePromotionBusinessIds(),
    ]);

    const activePromotionBusinessIds = activePromotionIdsResult.ok
      ? activePromotionIdsResult.businessIds
      : new Set<string>();

    if (!activePromotionIdsResult.ok && __DEV__) {
      console.error('[mapBusinesses:getMapBusinesses] promotion flags', activePromotionIdsResult.message);
    }

    const businesses = rows
      .map((row) =>
        mapRowToMapBusiness(
          row,
          coverImages.get(row.id) ?? null,
          activePromotionBusinessIds.has(row.id),
        ),
      )
      .filter((business): business is MapBusiness => business !== null);

    return { ok: true, businesses };
  } catch (error) {
    logDevError('getMapBusinesses', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load businesses for the map right now.',
    };
  }
}
