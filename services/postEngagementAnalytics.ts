import { supabase } from '@/lib/supabase';

import type { BusinessPostEngagementSummary } from '@/types/post-engagement';

export type BusinessEngagementAnalyticsResult =
  | { ok: true; summary: BusinessPostEngagementSummary }
  | { ok: false; code: 'network' | 'forbidden' | 'unexpected'; message: string };

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

export async function getBusinessPostEngagementForOwner(
  businessId: string,
): Promise<BusinessEngagementAnalyticsResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return {
      ok: true,
      summary: { totalLikes: 0, totalComments: 0, byPostId: {} },
    };
  }

  try {
    const { data, error } = await supabase.rpc('get_business_post_engagement_for_owner', {
      target_business_id: trimmedId,
    });

    if (error) {
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load engagement analytics.',
      };
    }

    if (data === null) {
      return {
        ok: false,
        code: 'forbidden',
        message: 'Engagement analytics are not available for this business.',
      };
    }

    const payload = data as {
      total_likes: number | string;
      total_comments: number | string;
      posts: { post_id: string; like_count: number | string; comment_count: number | string }[] | null;
    };

    const byPostId: BusinessPostEngagementSummary['byPostId'] = {};
    for (const row of payload.posts ?? []) {
      byPostId[row.post_id] = {
        postId: row.post_id,
        likeCount: Number(row.like_count) || 0,
        commentCount: Number(row.comment_count) || 0,
      };
    }

    return {
      ok: true,
      summary: {
        totalLikes: Number(payload.total_likes) || 0,
        totalComments: Number(payload.total_comments) || 0,
        byPostId,
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load engagement analytics.',
    };
  }
}
