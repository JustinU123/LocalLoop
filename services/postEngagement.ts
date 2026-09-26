import { getCurrentUserProfile } from '@/services/businesses';
import { supabase } from '@/lib/supabase';
import type { PublicPostComment } from '@/types/post-comment';
import { getCurrentSession } from '@/utils/auth';
import { formatCommentAuthorDisplayName } from '@/utils/post-comment-display';

export type PostEngagementErrorCode = 'unauthenticated' | 'forbidden' | 'network' | 'unexpected';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[postEngagement:${scope}]`, error);
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

export async function getPostsEngagementCounts(
  postIds: string[],
): Promise<
  | { ok: true; counts: Record<string, { likeCount: number; commentCount: number }> }
  | { ok: false; code: PostEngagementErrorCode; message: string }
> {
  const ids = [...new Set(postIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return { ok: true, counts: {} };
  }

  try {
    const { data, error } = await supabase.rpc('get_posts_engagement_counts', {
      post_ids: ids,
    });

    if (error) {
      logDevError('getPostsEngagementCounts', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load engagement counts.',
      };
    }

    const counts: Record<string, { likeCount: number; commentCount: number }> = {};
    for (const row of (data as { post_id: string; like_count: number; comment_count: number }[] | null) ??
      []) {
      counts[row.post_id] = {
        likeCount: Number(row.like_count) || 0,
        commentCount: Number(row.comment_count) || 0,
      };
    }

    return { ok: true, counts };
  } catch (error) {
    logDevError('getPostsEngagementCounts', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load engagement counts.',
    };
  }
}

export async function getUserLikedPostIds(
  postIds: string[],
): Promise<{ ok: true; likedPostIds: Set<string> } | { ok: false; code: PostEngagementErrorCode }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId || postIds.length === 0) {
    return { ok: true, likedPostIds: new Set() };
  }

  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (error) {
      logDevError('getUserLikedPostIds', error);
      return { ok: false, code: 'unexpected' };
    }

    const liked = new Set(((data as { post_id: string }[] | null) ?? []).map((r) => r.post_id));
    return { ok: true, likedPostIds: liked };
  } catch {
    return { ok: false, code: 'unexpected' };
  }
}

export async function likePost(postId: string): Promise<{ ok: true } | { ok: false; code: PostEngagementErrorCode }> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { ok: false, code: 'unauthenticated' };
  }

  const { error } = await supabase.from('post_likes').insert({
    post_id: postId.trim(),
    user_id: session.user.id,
  });

  if (error) {
    if (error.code === '23505') {
      return { ok: true };
    }
    logDevError('likePost', error);
    return { ok: false, code: error.code === '42501' ? 'forbidden' : 'unexpected' };
  }

  return { ok: true };
}

export async function unlikePost(
  postId: string,
): Promise<{ ok: true } | { ok: false; code: PostEngagementErrorCode }> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { ok: false, code: 'unauthenticated' };
  }

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId.trim())
    .eq('user_id', session.user.id);

  if (error) {
    logDevError('unlikePost', error);
    return { ok: false, code: 'unexpected' };
  }

  return { ok: true };
}

type PostCommentDbRow = {
  id: string;
  post_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
};

type PostCommentFeedRow = {
  id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  author_display_name: string | null;
};

function mapFeedRowToComment(postId: string, row: PostCommentFeedRow): PublicPostComment {
  return {
    id: row.id,
    postId,
    authorUserId: row.author_user_id,
    authorDisplayName: formatCommentAuthorDisplayName(row.author_display_name, row.author_user_id),
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapInsertRowToComment(
  row: PostCommentDbRow,
  authorDisplayName: string | null,
): PublicPostComment {
  return {
    id: row.id,
    postId: row.post_id,
    authorUserId: row.author_user_id,
    authorDisplayName: formatCommentAuthorDisplayName(authorDisplayName, row.author_user_id),
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getPostCommentsForFeed(
  postId: string,
): Promise<
  | { ok: true; comments: PublicPostComment[] }
  | { ok: false; code: PostEngagementErrorCode; message: string }
> {
  const trimmedId = postId.trim();
  if (!trimmedId) {
    return { ok: true, comments: [] };
  }

  try {
    const { data, error } = await supabase.rpc('get_post_comments_for_feed', {
      target_post_id: trimmedId,
    });

    if (error) {
      logDevError('getPostCommentsForFeed', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load comments.',
      };
    }

    const comments = ((data as PostCommentFeedRow[] | null) ?? []).map((row) =>
      mapFeedRowToComment(trimmedId, row),
    );

    return { ok: true, comments };
  } catch (error) {
    logDevError('getPostCommentsForFeed', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load comments.',
    };
  }
}

export async function addPostComment(
  postId: string,
  body: string,
): Promise<
  | { ok: true; comment: PublicPostComment }
  | { ok: false; code: PostEngagementErrorCode; message: string }
> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { ok: false, code: 'unauthenticated', message: 'Sign in to comment.' };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, code: 'unexpected', message: 'Comment cannot be empty.' };
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId.trim(),
      author_user_id: session.user.id,
      body: trimmed,
    })
    .select('id, post_id, author_user_id, body, created_at')
    .single();

  if (error) {
    logDevError('addPostComment', error);
    const forbidden = error.code === '42501';
    return {
      ok: false,
      code: forbidden ? 'forbidden' : 'unexpected',
      message: forbidden
        ? 'You cannot comment on this post.'
        : 'Unable to post comment.',
    };
  }

  const profile = await getCurrentUserProfile(session.user.id);
  const comment = mapInsertRowToComment(data as PostCommentDbRow, profile?.display_name ?? null);

  return { ok: true, comment };
}

export async function softDeletePostComment(
  commentId: string,
): Promise<{ ok: true } | { ok: false; code: PostEngagementErrorCode }> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { ok: false, code: 'unauthenticated' };
  }

  const { error } = await supabase
    .from('post_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId.trim())
    .eq('author_user_id', session.user.id);

  if (error) {
    logDevError('softDeletePostComment', error);
    return { ok: false, code: 'unexpected' };
  }

  return { ok: true };
}
