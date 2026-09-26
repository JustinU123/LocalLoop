import { supabase } from '@/lib/supabase';
import { formatRelativePostTime } from '@/services/explorePosts';
import { getBusinessEvents } from '@/services/events';
import { getActivePromotionsForBusiness } from '@/services/promotions';
import { getBusinessMenuItems, groupMenuItemsIntoSections } from '@/services/menuItems';
import { getBusinessPosts } from '@/services/posts';
import type { Business, BusinessPost } from '@/data/businesses';
import type { BusinessRow } from '@/types/supabase-business';
import type { BusinessEvent } from '@/types/supabase-event';
import type { BusinessMenuItem } from '@/types/supabase-menu-item';
import {
  resolveBusinessCoverUrl,
  resolveBusinessLogoUrl,
} from '@/utils/business-branding-display';

export type PublicBusinessProfileErrorCode = 'not_found' | 'network' | 'unexpected';

export type GetPublicBusinessProfileResult =
  | { ok: true; business: Business; source: 'supabase' }
  | { ok: false; code: PublicBusinessProfileErrorCode; message: string };

const PUBLIC_BUSINESS_SELECT =
  'id, owner_user_id, name, category, description, phone, email, instagram, website, street_address, city, state, postal_code, latitude, longitude, verification_status, logo_url, cover_image_url';

function logDevError(scope: string, error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error(`[publicBusinessProfile:${scope}]`, context ?? {}, error);
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

function buildAddress(row: BusinessRow): string {
  return [row.street_address, row.city, row.state, row.postal_code]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

function mapSupabaseBusinessToProfile(
  row: BusinessRow,
  posts: Array<{
    id: string;
    postType: 'photo' | 'announcement';
    imageUrl: string | null;
    caption: string | null;
    createdAt: string;
  }>,
  menuItems: BusinessMenuItem[],
  events: BusinessEvent[],
  promotions: Business['promotions'],
): Business {
  const postImages = posts
    .filter((post) => post.postType === 'photo' && post.imageUrl)
    .map((post) => post.imageUrl as string);
  const legacyCoverFallback = postImages[0] ?? menuItems[0]?.imageUrl ?? null;
  const legacyLogoFallback = postImages[0] ?? null;

  const logo = resolveBusinessLogoUrl({
    logoUrl: row.logo_url,
    legacyFallback: legacyLogoFallback,
  });
  const cover = resolveBusinessCoverUrl({
    coverUrl: row.cover_image_url,
    logoUrl: row.logo_url,
    legacyFallback: legacyCoverFallback,
  });

  const profilePosts: BusinessPost[] = posts.map((post) => ({
    id: post.id,
    postType: post.postType,
    image: post.imageUrl ?? undefined,
    caption: post.caption ?? '',
    postedAt: formatRelativePostTime(post.createdAt),
  }));

  const menu = groupMenuItemsIntoSections(menuItems);

  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    category: row.category?.trim() || 'Local Business',
    distance: '',
    rating: 0,
    reviewCount: 0,
    followerCount: 0,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    image: cover,
    logo,
    cover,
    verified: row.verification_status === 'verified',
    isOpen: false,
    phone: row.phone?.trim() ?? '',
    website: row.website?.trim() ?? '',
    address: buildAddress(row),
    about: row.description?.trim() ?? '',
    hours: '',
    photos: postImages,
    videos: [],
    posts: profilePosts,
    promotions,
    events,
    menu,
    reviews: [],
  };
}

export async function getPublicBusinessProfile(
  businessId: string,
): Promise<GetPublicBusinessProfileResult> {
  const trimmedId = businessId.trim();

  if (!trimmedId) {
    return {
      ok: false,
      code: 'not_found',
      message: 'Business not found',
    };
  }

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(PUBLIC_BUSINESS_SELECT)
      .eq('id', trimmedId)
      .eq('verification_status', 'verified')
      .maybeSingle();

    if (error) {
      logDevError('getPublicBusinessProfile.business', error, { businessId: trimmedId });
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load this business right now.',
      };
    }

    if (!data) {
      return {
        ok: false,
        code: 'not_found',
        message: 'Business not found',
      };
    }

    const postsResult = await getBusinessPosts(trimmedId);
    if (!postsResult.ok) {
      logDevError('getPublicBusinessProfile.posts', postsResult.message, {
        businessId: trimmedId,
      });
      return {
        ok: false,
        code: postsResult.code === 'network' ? 'network' : 'unexpected',
        message: 'Unable to load this business right now.',
      };
    }

    const menuItemsResult = await getBusinessMenuItems(trimmedId);
    if (!menuItemsResult.ok) {
      logDevError('getPublicBusinessProfile.menuItems', menuItemsResult.message, {
        businessId: trimmedId,
      });
      return {
        ok: false,
        code: menuItemsResult.code === 'network' ? 'network' : 'unexpected',
        message: 'Unable to load this business right now.',
      };
    }

    const eventsResult = await getBusinessEvents(trimmedId);
    if (!eventsResult.ok) {
      logDevError('getPublicBusinessProfile.events', eventsResult.message, {
        businessId: trimmedId,
      });
      return {
        ok: false,
        code: eventsResult.code === 'network' ? 'network' : 'unexpected',
        message: 'Unable to load this business right now.',
      };
    }

    const promotionsResult = await getActivePromotionsForBusiness(trimmedId);
    if (!promotionsResult.ok) {
      logDevError('getPublicBusinessProfile.promotions', promotionsResult.message, {
        businessId: trimmedId,
      });
      return {
        ok: false,
        code: promotionsResult.code === 'network' ? 'network' : 'unexpected',
        message: 'Unable to load this business right now.',
      };
    }

    const business = mapSupabaseBusinessToProfile(
      data as BusinessRow,
      postsResult.posts,
      menuItemsResult.items,
      eventsResult.events,
      promotionsResult.promotions,
    );

    return { ok: true, business, source: 'supabase' };
  } catch (error) {
    logDevError('getPublicBusinessProfile', error, { businessId: trimmedId });
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load this business right now.',
    };
  }
}
