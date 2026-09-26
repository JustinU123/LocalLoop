import type { ProPerformanceCoachViewModel } from '@/types/analytics-pro-performance';
import type { AnalyticsTimeRangeId } from '@/types/analytics-time-range';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';
import { countPostsCreatedSince, getAnalyticsTimeRangeDefinition } from '@/utils/analytics-time-range';

export type BuildProPerformanceCoachInput = {
  selectedRangeId: AnalyticsTimeRangeId;
  loading: boolean;
  posts: BusinessPost[];
  postsFailed: boolean;
  engagement: BusinessPostEngagementSummary | null;
  engagementFailed: boolean;
  totalFollowers: number | null;
  followersFailed: boolean;
};

function insufficientData(
  selectedRangeId: AnalyticsTimeRangeId,
  headline: string,
  explanation: string,
  nextMove: string,
  evidenceLabel: string,
): ProPerformanceCoachViewModel {
  return {
    state: 'insufficient_data',
    selectedRangeId,
    headline,
    explanation,
    nextMove,
    evidenceLabel,
  };
}

export function buildProPerformanceCoach(
  input: BuildProPerformanceCoachInput,
  nowMs: number = Date.now(),
): ProPerformanceCoachViewModel {
  const range = getAnalyticsTimeRangeDefinition(input.selectedRangeId);
  const periodPhrase = range.summaryPeriodPhrase;

  if (input.loading) {
    return {
      state: 'loading',
      selectedRangeId: input.selectedRangeId,
      headline: 'Loading performance signals',
      explanation: 'Performance Coach uses your posts and engagement once analytics finish loading.',
      nextMove: '—',
      evidenceLabel: `Period: ${range.pillLabel}`,
    };
  }

  if (input.postsFailed || input.engagementFailed) {
    return insufficientData(
      input.selectedRangeId,
      'Performance Coach needs your latest data',
      'We could not load posts or engagement for this business. Open Analytics again when you are back online.',
      'Refresh Analytics after your connection is stable.',
      'Data source unavailable',
    );
  }

  const postsInPeriod = countPostsCreatedSince(input.posts, input.selectedRangeId, nowMs);
  const totalLikes = input.engagement?.totalLikes ?? 0;
  const totalComments = input.engagement?.totalComments ?? 0;
  const hasLifetimeEngagement = totalLikes > 0 || totalComments > 0;
  const totalPosts = input.posts.length;

  if (postsInPeriod === 0 && totalPosts === 0) {
    return insufficientData(
      input.selectedRangeId,
      'Keep building your activity',
      'As your LocalLoop performance data grows, Performance Coach will identify patterns in your content and audience.',
      'Publish your first post to start collecting engagement signals.',
      `No posts yet · ${range.pillLabel}`,
    );
  }

  if (postsInPeriod === 0 && totalPosts > 0) {
    return {
      state: 'ready',
      selectedRangeId: input.selectedRangeId,
      headline: 'No posts in this period',
      explanation: `You have ${totalPosts} published ${totalPosts === 1 ? 'post' : 'posts'} on LocalLoop, but none were published in the ${periodPhrase}.`,
      nextMove: 'Publish fresh content or widen your time range to review recent activity.',
      evidenceLabel: `${postsInPeriod} posts in ${periodPhrase}`,
    };
  }

  if (postsInPeriod > 0 && !hasLifetimeEngagement) {
    return {
      state: 'ready',
      selectedRangeId: input.selectedRangeId,
      headline: 'Content is live — engagement is still building',
      explanation: `You published ${postsInPeriod} ${postsInPeriod === 1 ? 'post' : 'posts'} in the ${periodPhrase}. Likes and comments will inform next steps once customers interact.`,
      nextMove: 'Share your profile and keep posting so Performance Coach can spot what resonates.',
      evidenceLabel: `${postsInPeriod} posts in ${periodPhrase} · 0 likes · 0 comments (current totals)`,
    };
  }

  if (postsInPeriod > 0 && hasLifetimeEngagement) {
    return {
      state: 'ready',
      selectedRangeId: input.selectedRangeId,
      headline: 'You have measurable engagement on your content',
      explanation: `You published ${postsInPeriod} ${postsInPeriod === 1 ? 'post' : 'posts'} in the ${periodPhrase}. Your content currently has ${totalLikes} ${totalLikes === 1 ? 'like' : 'likes'} and ${totalComments} ${totalComments === 1 ? 'comment' : 'comments'} overall — period breakdowns for engagement will refine coaching later.`,
      nextMove: 'Keep posting consistently while LocalLoop adds period-level performance tracking.',
      evidenceLabel: `${postsInPeriod} posts in ${periodPhrase} · current engagement totals`,
    };
  }

  return insufficientData(
    input.selectedRangeId,
    'Keep building your activity',
    'As your LocalLoop performance data grows, Performance Coach will identify patterns in your content and audience.',
    'Publish posts and encourage customers to follow your business on LocalLoop.',
    `Period: ${range.pillLabel}`,
  );
}
