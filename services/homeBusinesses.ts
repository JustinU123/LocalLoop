import { supabase } from '@/lib/supabase';
import type { HomeBusiness, HomeCategoryChip } from '@/types/home-business';
import { resolveBusinessCoverUrl } from '@/utils/business-branding-display';

export type HomeDiscoveryErrorCode = 'network' | 'unexpected';

export type GetHomeDiscoveryResult =
  | { ok: true; businesses: HomeBusiness[] }
  | { ok: false; code: HomeDiscoveryErrorCode; message: string };

type VerifiedBusinessRow = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  created_at: string;
};

type PublishedPostRow = {
  business_id: string;
  image_url: string | null;
  created_at: string;
};

const VERIFIED_BUSINESS_SELECT =
  'id, name, category, description, city, state, logo_url, cover_image_url, created_at';

const CATEGORY_ICON_MAP: Record<string, HomeCategoryChip> = {
  food: { id: 'food', label: 'Food', icon: 'restaurant' },
  clothing: { id: 'clothing', label: 'Clothing', icon: 'shirt' },
  coffee: { id: 'coffee', label: 'Coffee', icon: 'cafe' },
  beauty: { id: 'beauty', label: 'Beauty', icon: 'sparkles' },
  fitness: { id: 'fitness', label: 'Fitness', icon: 'barbell' },
};

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[homeBusinesses:${scope}]`, error);
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

function normalizeCategoryLabel(category: string | null): string {
  const trimmed = category?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Local Business';
}

function inferCategoryChipId(category: string): string {
  const lower = category.toLowerCase();

  if (
    lower.includes('food') ||
    lower.includes('restaurant') ||
    lower.includes('taco') ||
    lower.includes('bakery') ||
    lower.includes('cafe') ||
    lower.includes('coffee')
  ) {
    return lower.includes('coffee') || lower.includes('cafe') ? 'coffee' : 'food';
  }

  if (
    lower.includes('cloth') ||
    lower.includes('boutique') ||
    lower.includes('vintage') ||
    lower.includes('apparel')
  ) {
    return 'clothing';
  }

  if (lower.includes('beauty') || lower.includes('salon') || lower.includes('spa')) {
    return 'beauty';
  }

  if (
    lower.includes('fitness') ||
    lower.includes('gym') ||
    lower.includes('yoga') ||
    lower.includes('pilates')
  ) {
    return 'fitness';
  }

  return 'local';
}

export function formatHomeBusinessLocation(business: HomeBusiness): string | null {
  const parts = [business.city?.trim(), business.state?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function buildHomeCategoryChips(businesses: HomeBusiness[]): HomeCategoryChip[] {
  const chips: HomeCategoryChip[] = [{ id: 'all', label: 'All', icon: 'grid' }];
  const seen = new Set<string>(['all']);

  for (const business of businesses) {
    const chipId = inferCategoryChipId(business.category);
    if (seen.has(chipId)) {
      continue;
    }

    seen.add(chipId);
    chips.push(
      CATEGORY_ICON_MAP[chipId] ?? {
        id: chipId,
        label: business.category,
        icon: 'storefront-outline',
      },
    );
  }

  return chips;
}

export function filterHomeBusinessesByCategory(
  businesses: HomeBusiness[],
  categoryId: string,
): HomeBusiness[] {
  if (categoryId === 'all') {
    return businesses;
  }

  return businesses.filter((business) => inferCategoryChipId(business.category) === categoryId);
}

export function buildRecentlyActiveBusinesses(businesses: HomeBusiness[]): HomeBusiness[] {
  return businesses
    .filter((business) => business.latestPostAt)
    .sort((left, right) => {
      const leftTime = new Date(left.latestPostAt ?? 0).getTime();
      const rightTime = new Date(right.latestPostAt ?? 0).getTime();
      return rightTime - leftTime;
    });
}

export function buildNewOnLocalLoopBusinesses(businesses: HomeBusiness[]): HomeBusiness[] {
  return [...businesses].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return rightTime - leftTime;
  });
}

export async function getHomeDiscoveryBusinesses(): Promise<GetHomeDiscoveryResult> {
  try {
    const [businessesResult, postsResult] = await Promise.all([
      supabase
        .from('businesses')
        .select(VERIFIED_BUSINESS_SELECT)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false }),
      supabase
        .from('posts')
        .select('business_id, image_url, created_at')
        .eq('status', 'published')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false }),
    ]);

    if (businessesResult.error) {
      logDevError('getHomeDiscoveryBusinesses.businesses', businessesResult.error);
      return {
        ok: false,
        code: isNetworkError(businessesResult.error) ? 'network' : 'unexpected',
        message: 'We couldn’t load local businesses right now.',
      };
    }

    if (postsResult.error) {
      logDevError('getHomeDiscoveryBusinesses.posts', postsResult.error);
      return {
        ok: false,
        code: isNetworkError(postsResult.error) ? 'network' : 'unexpected',
        message: 'We couldn’t load local businesses right now.',
      };
    }

    const latestPostByBusiness = new Map<
      string,
      { imageUrl: string; createdAt: string }
    >();

    for (const post of (postsResult.data as PublishedPostRow[] | null) ?? []) {
      if (!post.image_url || latestPostByBusiness.has(post.business_id)) {
        continue;
      }

      latestPostByBusiness.set(post.business_id, {
        imageUrl: post.image_url,
        createdAt: post.created_at,
      });
    }

    const businesses = ((businessesResult.data as VerifiedBusinessRow[] | null) ?? []).map(
      (row): HomeBusiness => {
        const latestPost = latestPostByBusiness.get(row.id);

        const coverImageUrl = resolveBusinessCoverUrl({
          coverUrl: row.cover_image_url,
          logoUrl: row.logo_url,
          legacyFallback: latestPost?.imageUrl ?? null,
        });

        return {
          id: row.id,
          name: row.name,
          category: normalizeCategoryLabel(row.category),
          description: row.description,
          city: row.city,
          state: row.state,
          coverImageUrl: coverImageUrl || null,
          latestPostAt: latestPost?.createdAt ?? null,
          createdAt: row.created_at,
        };
      },
    );

    return { ok: true, businesses };
  } catch (error) {
    logDevError('getHomeDiscoveryBusinesses', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'We couldn’t load local businesses right now.',
    };
  }
}
