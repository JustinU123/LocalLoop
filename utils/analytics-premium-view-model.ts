import type { AnalyticsMetricState } from '@/types/analytics-access';
import type { AudienceInsightsData, ContentInsightsData } from '@/types/analytics-premium-data';
import { UNAVAILABLE_ADVANCED_INSIGHTS as ADVANCED_UNAVAILABLE } from '@/types/analytics-premium-data';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';
import { engagementCountMetric } from '@/utils/analytics-engagement-metrics';

function unavailableMetric(loading: boolean): AnalyticsMetricState {
  return loading ? { state: 'loading' } : { state: 'unavailable' };
}

function captionPreview(post: BusinessPost): string {
  const caption = post.caption?.trim();
  if (caption) {
    return caption.length > 72 ? `${caption.slice(0, 69)}…` : caption;
  }
  return post.postType === 'announcement' ? 'Announcement' : 'Photo post';
}

function formatPostedDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getAdvancedInsightsViewModel(
  loading: boolean,
  engagement?: {
    summary: BusinessPostEngagementSummary | null;
    failed: boolean;
  },
) {
  const likesMetric = engagementCountMetric({
    loading,
    failed: engagement?.failed ?? false,
    value: engagement?.failed ? null : (engagement?.summary?.totalLikes ?? 0),
  });
  const commentsMetric = engagementCountMetric({
    loading,
    failed: engagement?.failed ?? false,
    value: engagement?.failed ? null : (engagement?.summary?.totalComments ?? 0),
  });

  if (loading) {
    return {
      ...ADVANCED_UNAVAILABLE,
      profileViews: { state: 'loading' as const },
      impressions: { state: 'loading' as const },
      saves: { state: 'loading' as const },
      engagementRate: { state: 'loading' as const },
      likes: { state: 'loading' as const },
      comments: { state: 'loading' as const },
      followersGained: { state: 'loading' as const },
      performanceOverTime: 'loading' as const,
      funnel: {
        impressions: { state: 'loading' as const },
        profileVisits: { state: 'loading' as const },
        savesAndFollows: { state: 'loading' as const },
      },
    };
  }
  return {
    ...ADVANCED_UNAVAILABLE,
    likes: likesMetric,
    comments: commentsMetric,
  };
}

function postEngagementMetric(
  postId: string,
  loading: boolean,
  engagement: BusinessPostEngagementSummary | null,
  failed: boolean,
  field: 'likeCount' | 'commentCount',
): AnalyticsMetricState {
  if (failed) {
    return { state: 'unavailable' };
  }
  if (loading) {
    return { state: 'loading' };
  }
  const row = engagement?.byPostId[postId];
  const value = row ? row[field] : 0;
  return { state: 'ready', value };
}

export function buildContentInsightsViewModel(
  posts: BusinessPost[],
  loading: boolean,
  engagement?: {
    summary: BusinessPostEngagementSummary | null;
    failed: boolean;
  },
): ContentInsightsData {
  const metric = unavailableMetric(loading);
  return {
    topPosts: posts.slice(0, 5).map((post) => ({
      id: post.id,
      title: captionPreview(post),
      postedAtLabel: formatPostedDate(post.createdAt),
      imageUri: post.imageUrl?.trim() ?? null,
      views: metric,
      saves: metric,
      likes: postEngagementMetric(post.id, loading, engagement?.summary ?? null, engagement?.failed ?? false, 'likeCount'),
      comments: postEngagementMetric(
        post.id,
        loading,
        engagement?.summary ?? null,
        engagement?.failed ?? false,
        'commentCount',
      ),
      engagement: metric,
    })),
    bestFormat: metric,
    bestPostingTimes: metric,
    postingCadence: metric,
    opportunities: loading ? 'loading' : 'unavailable',
  };
}

export function buildAudienceInsightsViewModel(params: {
  totalFollowers: number | null;
  loading: boolean;
  followersFailed: boolean;
}): AudienceInsightsData {
  const { totalFollowers, loading, followersFailed } = params;

  let totalFollowersMetric: AnalyticsMetricState = { state: 'unavailable' };
  if (followersFailed) {
    totalFollowersMetric = { state: 'unavailable' };
  } else if (loading) {
    totalFollowersMetric = { state: 'loading' };
  } else if (totalFollowers !== null) {
    totalFollowersMetric = { state: 'ready', value: totalFollowers };
  }

  const unavailable = unavailableMetric(loading && !followersFailed);

  return {
    totalFollowers: totalFollowersMetric,
    followerGrowth: unavailable,
    returningEngagement: unavailable,
    newEngagement: unavailable,
    engagementByTime: loading ? 'loading' : 'unavailable',
    localActivity: loading ? 'loading' : 'unavailable',
  };
}
