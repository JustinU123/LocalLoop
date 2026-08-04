import { supabase } from '@/lib/supabase';
import type { ExplorePost } from '@/data/explore-posts';

export type ExplorePostsErrorCode = 'network' | 'unexpected';

export type GetPublishedExplorePostsResult =
  | { ok: true; posts: ExplorePost[] }
  | { ok: false; code: ExplorePostsErrorCode; message: string };

type ExploreBusinessRow = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
};

type ExplorePostRow = {
  id: string;
  business_id: string;
  caption: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  businesses: ExploreBusinessRow | ExploreBusinessRow[] | null;
};

function resolveBusinessRow(
  businesses: ExploreBusinessRow | ExploreBusinessRow[] | null,
): ExploreBusinessRow | null {
  if (!businesses) {
    return null;
  }

  return Array.isArray(businesses) ? (businesses[0] ?? null) : businesses;
}

const EXPLORE_POST_SELECT = `
  id,
  business_id,
  caption,
  image_url,
  status,
  created_at,
  businesses!inner (
    id,
    name,
    category,
    description,
    city,
    state,
    verification_status
  )
`;

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[explorePosts:${scope}]`, error);
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

export function formatRelativePostTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function mapRowToExplorePost(row: ExplorePostRow): ExplorePost | null {
  const business = resolveBusinessRow(row.businesses);
  if (!business || !row.image_url || row.status !== 'published') {
    return null;
  }

  if (business.verification_status !== 'verified') {
    return null;
  }

  return {
    id: row.id,
    businessId: business.id,
    businessName: business.name,
    businessLogo: null,
    category: business.category?.trim() || 'Local Business',
    distance: '',
    distanceMiles: 0,
    verified: true,
    initiallyFollowed: false,
    mediaType: 'photo',
    mediaUri: row.image_url,
    caption: row.caption?.trim() ?? '',
    postedAt: formatRelativePostTime(row.created_at),
    likeCount: 0,
    commentCount: 0,
  };
}

export async function getPublishedExplorePosts(): Promise<GetPublishedExplorePostsResult> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(EXPLORE_POST_SELECT)
      .eq('status', 'published')
      .eq('businesses.verification_status', 'verified')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      logDevError('getPublishedExplorePosts', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'We couldn’t load local posts right now.',
      };
    }

    const posts = ((data as unknown as ExplorePostRow[] | null) ?? [])
      .map(mapRowToExplorePost)
      .filter((post): post is ExplorePost => post !== null);

    return { ok: true, posts };
  } catch (error) {
    logDevError('getPublishedExplorePosts', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'We couldn’t load local posts right now.',
    };
  }
}

/**
 * Nearby currently returns all published posts from verified businesses.
 * True distance filtering is not connected yet because reliable coordinates
 * are not stored on every business row.
 */
export function filterExplorePostsForSegment(
  posts: ExplorePost[],
  segment: 'nearby' | 'following',
  followedBusinessIds: Set<string>,
): ExplorePost[] {
  if (segment === 'nearby') {
    return posts;
  }

  return posts.filter((post) => followedBusinessIds.has(post.businessId));
}
