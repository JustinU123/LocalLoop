import { supabase } from '@/lib/supabase';
import { formatRelativePostTime } from '@/services/explorePosts';
import { getBusinessPosts } from '@/services/posts';
import type { Business, BusinessPost } from '@/data/businesses';
import type { BusinessRow } from '@/types/supabase-business';

export type PublicBusinessProfileErrorCode = 'not_found' | 'network' | 'unexpected';

export type GetPublicBusinessProfileResult =
  | { ok: true; business: Business; source: 'supabase' }
  | { ok: false; code: PublicBusinessProfileErrorCode; message: string };

const PUBLIC_BUSINESS_SELECT =
  'id, name, category, description, phone, email, instagram, website, street_address, city, state, postal_code, latitude, longitude, verification_status';

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
  posts: Array<{ id: string; imageUrl: string; caption: string | null; createdAt: string }>,
): Business {
  const postImages = posts.map((post) => post.imageUrl).filter(Boolean);
  const coverImage = postImages[0] ?? '';

  const profilePosts: BusinessPost[] = posts.map((post) => ({
    id: post.id,
    image: post.imageUrl,
    caption: post.caption ?? '',
    postedAt: formatRelativePostTime(post.createdAt),
  }));

  return {
    id: row.id,
    name: row.name,
    category: row.category?.trim() || 'Local Business',
    distance: '',
    rating: 0,
    reviewCount: 0,
    followerCount: 0,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    image: coverImage,
    logo: coverImage,
    cover: coverImage,
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
    promotions: [],
    menu: [],
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
      if (__DEV__) {
        console.info('[publicBusinessProfile] no verified business row', { businessId: trimmedId });
      }
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

    const business = mapSupabaseBusinessToProfile(data as BusinessRow, postsResult.posts);

    if (__DEV__) {
      console.info('[publicBusinessProfile] loaded', {
        businessId: trimmedId,
        postCount: business.posts.length,
      });
    }

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
