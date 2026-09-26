import type {
  AnalyticsSummaryPeriodId,
  PremiumBusinessSummaryChip,
  PremiumBusinessSummaryViewModel,
} from '@/types/analytics-business-summary';
import type { BusinessPost } from '@/types/supabase-post';
import {
  countPostsCreatedSince,
  getAnalyticsTimeRangeDefinition,
} from '@/utils/analytics-time-range';

export type BuildPremiumBusinessSummaryInput = {
  selectedPeriod: AnalyticsSummaryPeriodId;
  loading: boolean;
  totalFollowers: number | null;
  followersFailed: boolean;
  /** Set only when an owner-safe backend source exists. Currently always null. */
  followersGainedInPeriod: number | null;
  posts: BusinessPost[];
  postsFailed: boolean;
  totalLikes: number | null;
  totalComments: number | null;
  engagementFailed: boolean;
};

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function formatFollowersGained(count: number, periodLabel: string): string {
  if (count === 0) {
    return `You have not gained new followers in the ${periodLabel}`;
  }
  return `You gained ${count} new ${pluralize(count, 'follower', 'followers')} in the ${periodLabel}`;
}

function formatTotalFollowers(count: number): string {
  return `Your business currently has ${count} ${pluralize(count, 'follower', 'followers')} on LocalLoop`;
}

function formatPostsInPeriod(count: number, periodLabel: string): string {
  if (count === 0) {
    return `You have not published posts in the ${periodLabel}`;
  }
  return `You published ${count} ${pluralize(count, 'post', 'posts')} in the ${periodLabel}`;
}

function formatCurrentEngagement(totalLikes: number, totalComments: number): string | null {
  if (totalLikes <= 0 && totalComments <= 0) {
    return null;
  }
  if (totalLikes > 0 && totalComments > 0) {
    return `Your content currently has ${totalLikes} ${pluralize(totalLikes, 'like', 'likes')} and ${totalComments} ${pluralize(totalComments, 'comment', 'comments')}`;
  }
  if (totalLikes > 0) {
    return `Your content has received ${totalLikes} ${pluralize(totalLikes, 'like', 'likes')}`;
  }
  return `Your content currently has ${totalComments} ${pluralize(totalComments, 'comment', 'comments')}`;
}

function buildSignalChips(params: {
  totalFollowers: number | null;
  followersFailed: boolean;
  postsInPeriod: number;
  postsFailed: boolean;
  totalPosts: number;
  totalLikes: number | null;
  totalComments: number | null;
  engagementFailed: boolean;
  chipPeriodPhrase: string;
}): PremiumBusinessSummaryChip[] {
  const chips: PremiumBusinessSummaryChip[] = [];

  if (!params.followersFailed && params.totalFollowers !== null) {
    chips.push({
      id: 'total-followers',
      label: `${params.totalFollowers} Total ${pluralize(params.totalFollowers, 'follower', 'followers')}`,
    });
  }

  if (!params.engagementFailed && params.totalLikes !== null && params.totalLikes > 0) {
    chips.push({
      id: 'total-likes',
      label: `${params.totalLikes} ${pluralize(params.totalLikes, 'Like', 'Likes')}`,
    });
  }

  if (!params.engagementFailed && params.totalComments !== null && params.totalComments > 0) {
    chips.push({
      id: 'total-comments',
      label: `${params.totalComments} ${pluralize(params.totalComments, 'Comment', 'Comments')}`,
    });
  }

  if (!params.postsFailed) {
    chips.push({
      id: 'posts-period',
      label: `${params.postsInPeriod} ${pluralize(params.postsInPeriod, 'Post', 'Posts')} ${params.chipPeriodPhrase}`,
    });
    chips.push({
      id: 'posts-total',
      label: `${params.totalPosts} Total ${pluralize(params.totalPosts, 'post', 'posts')}`,
    });
  }

  return chips.slice(0, 3);
}

const GETTING_STARTED_BODY =
  'Your LocalLoop presence is just getting started. As people discover your business and interact with your content, your Business Summary will become more detailed.';

const CLOSING_WITH_ACTIVITY =
  'Keep building your LocalLoop presence to give Competitive Intelligence more activity to analyze.';

export function buildPremiumBusinessSummary(
  input: BuildPremiumBusinessSummaryInput,
  nowMs: number = Date.now(),
): PremiumBusinessSummaryViewModel {
  const range = getAnalyticsTimeRangeDefinition(input.selectedPeriod);
  const periodLabel = range.summaryPeriodPhrase;

  if (input.loading) {
    return {
      periodId: input.selectedPeriod,
      periodLabel,
      availability: { state: 'loading' },
      contentKey: `loading:${input.selectedPeriod}`,
    };
  }

  const postsInPeriod = input.postsFailed
    ? null
    : countPostsCreatedSince(input.posts, input.selectedPeriod, nowMs);
  const totalPosts = input.postsFailed ? null : input.posts.length;

  const totalLikes = input.engagementFailed ? null : (input.totalLikes ?? 0);
  const totalComments = input.engagementFailed ? null : (input.totalComments ?? 0);

  const chips = buildSignalChips({
    totalFollowers: input.totalFollowers,
    followersFailed: input.followersFailed,
    postsInPeriod: postsInPeriod ?? 0,
    postsFailed: input.postsFailed,
    totalPosts: totalPosts ?? 0,
    totalLikes,
    totalComments,
    engagementFailed: input.engagementFailed,
    chipPeriodPhrase: range.chipPeriodPhrase,
  });

  const provableParts: string[] = [];

  if (input.followersGainedInPeriod !== null && !input.followersFailed) {
    provableParts.push(formatFollowersGained(input.followersGainedInPeriod, periodLabel));
  } else if (!input.followersFailed && input.totalFollowers !== null) {
    provableParts.push(formatTotalFollowers(input.totalFollowers));
  }

  if (postsInPeriod !== null) {
    provableParts.push(formatPostsInPeriod(postsInPeriod, periodLabel));
  }

  if (!input.engagementFailed && totalLikes !== null && totalComments !== null) {
    const engagementSentence = formatCurrentEngagement(totalLikes, totalComments);
    if (engagementSentence) {
      provableParts.push(engagementSentence);
    }
  }

  const hasFollowerSignal =
    !input.followersFailed &&
    (input.totalFollowers !== null || input.followersGainedInPeriod !== null);
  const hasPostSignal = postsInPeriod !== null;
  const hasAnyActivity =
    (input.totalFollowers ?? 0) > 0 ||
    (postsInPeriod ?? 0) > 0 ||
    (totalPosts ?? 0) > 0 ||
    (totalLikes ?? 0) > 0 ||
    (totalComments ?? 0) > 0;

  if (!hasFollowerSignal && !hasPostSignal) {
    return {
      periodId: input.selectedPeriod,
      periodLabel,
      availability: { state: 'sparse', body: GETTING_STARTED_BODY, chips: [] },
      contentKey: `sparse:${input.selectedPeriod}:none`,
    };
  }

  if (provableParts.length === 0 || !hasAnyActivity) {
    return {
      periodId: input.selectedPeriod,
      periodLabel,
      availability: { state: 'sparse', body: GETTING_STARTED_BODY, chips },
      contentKey: `sparse:${input.selectedPeriod}:${chips.map((c) => c.id).join(',')}`,
    };
  }

  let body = provableParts.join(' and ') + '.';
  if (hasAnyActivity) {
    body += ` ${CLOSING_WITH_ACTIVITY}`;
  }

  return {
    periodId: input.selectedPeriod,
    periodLabel,
    availability: { state: 'ready', body, chips },
    contentKey: `ready:${input.selectedPeriod}:${body}`,
  };
}
