import { supabase } from '@/lib/supabase';
import type { BusinessSearchResult, BusinessSearchRow } from '@/types/business-search';
import {
  rankBusinessSearchResults,
  sanitizeSearchQueryForIlike,
  tokenizeSearchQuery,
} from '@/utils/business-search-ranking';
import type { MapCoordinate } from '@/utils/map-filters';
import { resolveBusinessLogoUrl } from '@/utils/business-branding-display';

export type BusinessSearchErrorCode = 'network' | 'unexpected';

export type SearchDiscoverableBusinessesResult =
  | { ok: true; results: BusinessSearchResult[] }
  | { ok: false; code: BusinessSearchErrorCode; message: string };

const BUSINESS_SEARCH_SELECT =
  'id, name, category, city, state, street_address, latitude, longitude, verification_status, logo_url, cover_image_url';

type BusinessSearchDbRow = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  street_address: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: string;
  logo_url: string | null;
  cover_image_url: string | null;
};

type PublishedPostRow = {
  business_id: string;
  image_url: string | null;
  created_at: string;
};

const MIN_QUERY_LENGTH = 2;
const MAX_CANDIDATES = 150;
const MAX_RESULTS = 40;

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[businessSearch:${scope}]`, error);
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

function normalizeCategory(category: string | null): string {
  const trimmed = category?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Local Business';
}

function buildLocationLabel(city: string | null, state: string | null): string | null {
  const parts = [city?.trim(), state?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function mapRowToResult(row: BusinessSearchRow): BusinessSearchResult {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    city: row.city,
    state: row.state,
    locationLabel: buildLocationLabel(row.city, row.state),
    imageUrl: row.imageUrl,
    verified: row.verification_status === 'verified',
    distanceMiles: row.distanceMiles,
    distanceLabel: row.distanceLabel,
  };
}

async function attachCoverImages(rows: BusinessSearchRow[]): Promise<BusinessSearchRow[]> {
  if (rows.length === 0) {
    return rows;
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
    return rows;
  }

  const latestImageByBusiness = new Map<string, string>();

  for (const post of (data as PublishedPostRow[] | null) ?? []) {
    if (!post.image_url || latestImageByBusiness.has(post.business_id)) {
      continue;
    }
    latestImageByBusiness.set(post.business_id, post.image_url);
  }

  return rows.map((row) => {
    const legacyPostImage = latestImageByBusiness.get(row.id) ?? null;
    const resolvedLogo = resolveBusinessLogoUrl({
      logoUrl: row.logo_url,
      legacyFallback: legacyPostImage,
    });

    return {
      ...row,
      imageUrl: resolvedLogo || null,
    };
  });
}

function buildIlikePattern(token: string): string {
  return `%${token}%`;
}

export async function searchDiscoverableBusinesses(
  rawQuery: string,
  origin: MapCoordinate | null,
): Promise<SearchDiscoverableBusinessesResult> {
  const query = sanitizeSearchQueryForIlike(rawQuery);

  if (query.length < MIN_QUERY_LENGTH) {
    return { ok: true, results: [] };
  }

  const tokens = tokenizeSearchQuery(query);
  const primaryToken = tokens[0] ?? query.toLowerCase();
  const pattern = buildIlikePattern(primaryToken);
  const orFilter = [
    `name.ilike.${pattern}`,
    `category.ilike.${pattern}`,
    `city.ilike.${pattern}`,
    `state.ilike.${pattern}`,
    `street_address.ilike.${pattern}`,
  ].join(',');

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(BUSINESS_SEARCH_SELECT)
      .eq('verification_status', 'verified')
      .or(orFilter)
      .limit(MAX_CANDIDATES);

    if (error) {
      logDevError('searchDiscoverableBusinesses', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to search businesses right now.',
      };
    }

    const dbRows = ((data as BusinessSearchDbRow[] | null) ?? []).map(
      (row): BusinessSearchRow => ({
        id: row.id,
        name: row.name,
        category: normalizeCategory(row.category),
        city: row.city,
        state: row.state,
        street_address: row.street_address,
        latitude: row.latitude,
        longitude: row.longitude,
        verification_status: row.verification_status,
        logo_url: row.logo_url,
        cover_image_url: row.cover_image_url,
        imageUrl: null,
        distanceMiles: null,
        distanceLabel: null,
      }),
    );

    const ranked = rankBusinessSearchResults(dbRows, query, origin).slice(0, MAX_RESULTS);

    const withImages = await attachCoverImages(ranked);

    return {
      ok: true,
      results: withImages.map(mapRowToResult),
    };
  } catch (error) {
    logDevError('searchDiscoverableBusinesses', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to search businesses right now.',
    };
  }
}
