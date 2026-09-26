import type { AnalyticsMetricState } from '@/types/analytics-access';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';
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

export type ProContentPostRow = {
  id: string;
  title: string;
  postedAtLabel: string;
  imageUri: string | null;
  views: AnalyticsMetricState;
  saves: AnalyticsMetricState;
  likes: AnalyticsMetricState;
  comments: AnalyticsMetricState;
  engagementRate: AnalyticsMetricState;
};

export type ProContentInsightsData = {
  posts: ProContentPostRow[];
  bestFormat: AnalyticsMetricState;
  bestPostingTimes: AnalyticsMetricState;
  postingCadence: AnalyticsMetricState;
  engagementPatterns: AnalyticsMetricState;
};

export function buildProContentInsightsViewModel(
  posts: BusinessPost[],
  loading: boolean,
  engagement?: {
    summary: BusinessPostEngagementSummary | null;
    failed: boolean;
  },
): ProContentInsightsData {
  const unavailable = unavailableMetric(loading);
  const failed = engagement?.failed ?? false;
  const summary = engagement?.summary ?? null;

  return {
    posts: posts.map((post) => ({
      id: post.id,
      title: captionPreview(post),
      postedAtLabel: formatPostedDate(post.createdAt),
      imageUri: post.imageUrl?.trim() ?? null,
      views: unavailable,
      saves: unavailable,
      likes: postEngagementMetric(post.id, loading, summary, failed, 'likeCount'),
      comments: postEngagementMetric(post.id, loading, summary, failed, 'commentCount'),
      engagementRate: unavailable,
    })),
    bestFormat: unavailable,
    bestPostingTimes: unavailable,
    postingCadence: unavailable,
    engagementPatterns: unavailable,
  };
}

export function proPerformanceSummaryMetricValue(
  metricId: 'likes' | 'comments',
  loading: boolean,
  engagement: BusinessPostEngagementSummary | null,
  engagementFailed: boolean,
): string {
  if (engagementFailed) {
    return '—';
  }
  if (loading) {
    return '…';
  }
  if (metricId === 'likes') {
    return String(engagement?.totalLikes ?? 0);
  }
  return String(engagement?.totalComments ?? 0);
}
