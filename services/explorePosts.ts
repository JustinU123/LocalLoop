import { supabase } from '@/lib/supabase';
import type { ExplorePost } from '@/data/explore-posts';
import type { ConsumerPublishedPost } from '@/types/consumer-published-post';
import type { PostType } from '@/types/supabase-post';
import { getPostsEngagementCounts, getUserLikedPostIds } from '@/services/postEngagement';
import { resolveBusinessLogoUrl } from '@/utils/business-branding-display';

export type ExplorePostsErrorCode = 'network' | 'unexpected';

export type GetPublishedPostByIdResult =
  | { ok: true; post: ConsumerPublishedPost }
  | { ok: false; code: ExplorePostsErrorCode | 'not_found'; message: string };

export type GetPublishedExplorePostsResult =
  | {
      ok: true;
      posts: ExplorePost[];
      likedPostIds: Set<string>;
    }
  | { ok: false; code: ExplorePostsErrorCode; message: string };

type ExploreBusinessRow = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
  logo_url: string | null;
};

type ExplorePostRow = {
  id: string;
  business_id: string;
  caption: string | null;
  image_url: string | null;
  post_type: PostType | null;
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
  post_type,
  status,
  created_at,
  businesses!inner (
    id,
    name,
    category,
    description,
    city,
    state,
    verification_status,
    logo_url
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

function resolvePostType(row: ExplorePostRow): PostType {
  return row.post_type === 'announcement' ? 'announcement' : 'photo';
}

function mapRowToConsumerPublishedPost(row: ExplorePostRow): ConsumerPublishedPost | null {
  const business = resolveBusinessRow(row.businesses);
  if (!business || row.status !== 'published') {
    return null;
  }

  if (business.verification_status !== 'verified') {
    return null;
  }

  const postType = resolvePostType(row);
  if (postType === 'photo' && !row.image_url) {
    return null;
  }

  return {
    id: row.id,
    businessId: business.id,
    businessName: business.name,
    businessLogo: resolveBusinessLogoUrl({ logoUrl: business.logo_url }) || null,
    category: business.category?.trim() || 'Local Business',
    distance: '',
    distanceMiles: 0,
    verified: true,
    initiallyFollowed: false,
    mediaType: 'photo',
    mediaUri: row.image_url?.trim() ?? '',
    caption: row.caption?.trim() ?? '',
    postedAt: formatRelativePostTime(row.created_at),
    likeCount: 0,
    commentCount: 0,
    postType,
    createdAt: row.created_at,
  };
}

function mapRowToExplorePost(row: ExplorePostRow): ExplorePost | null {
  const mapped = mapRowToConsumerPublishedPost(row);
  if (!mapped || mapped.postType !== 'photo' || !mapped.mediaUri) {
    return null;
  }
  return mapped;
}

export async function getPublishedPostById(postId: string): Promise<GetPublishedPostByIdResult> {
  const trimmedId = postId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: 'Post not found.' };
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(EXPLORE_POST_SELECT)
      .eq('id', trimmedId)
      .eq('status', 'published')
      .eq('businesses.verification_status', 'verified')
      .maybeSingle();

    if (error) {
      logDevError('getPublishedPostById', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load this post right now.',
      };
    }

    if (!data) {
      return { ok: false, code: 'not_found', message: 'Post not found.' };
    }

    const post = mapRowToConsumerPublishedPost(data as unknown as ExplorePostRow);
    if (!post) {
      return { ok: false, code: 'not_found', message: 'Post not found.' };
    }

    const countsResult = await getPostsEngagementCounts([post.id]);
    if (countsResult.ok) {
      const engagement = countsResult.counts[post.id];
      post.likeCount = engagement?.likeCount ?? 0;
      post.commentCount = engagement?.commentCount ?? 0;
    }

    return { ok: true, post };
  } catch (error) {
    logDevError('getPublishedPostById', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load this post right now.',
    };
  }
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

    const postIds = posts.map((post) => post.id);
    const [countsResult, likedResult] = await Promise.all([
      getPostsEngagementCounts(postIds),
      getUserLikedPostIds(postIds),
    ]);

    const counts = countsResult.ok ? countsResult.counts : {};
    const likedPostIds = likedResult.ok ? likedResult.likedPostIds : new Set<string>();

    const postsWithEngagement = posts.map((post) => {
      const engagement = counts[post.id];
      return {
        ...post,
        likeCount: engagement?.likeCount ?? 0,
        commentCount: engagement?.commentCount ?? 0,
      };
    });

    return { ok: true, posts: postsWithEngagement, likedPostIds };
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
