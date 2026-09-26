import type { WeeklySnapshotMetricState, WeeklySnapshotViewModel } from '@/types/analytics-weekly-snapshot';
import type { BusinessPost } from '@/types/supabase-post';
import { countPostsCreatedSince } from '@/utils/analytics-time-range';

export type WeeklySnapshotEngagementPeriodInput =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; likesReceived: number; commentsReceived: number }
  | { status: 'unavailable' };

export type WeeklySnapshotFollowersPeriodInput =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; followersGained: number }
  | { status: 'unavailable' };

export type BuildWeeklySnapshotInput = {
  postsLoading: boolean;
  postsFailed: boolean;
  posts: BusinessPost[];
  engagementPeriod: WeeklySnapshotEngagementPeriodInput;
  followersPeriod: WeeklySnapshotFollowersPeriodInput;
  nowMs?: number;
};

export function formatWeeklySnapshotMetricDisplay(metric: WeeklySnapshotMetricState): string {
  if (metric.state === 'loading') {
    return '…';
  }
  if (metric.state === 'unavailable') {
    return '—';
  }
  return String(metric.value);
}

export function buildWeeklySnapshot(input: BuildWeeklySnapshotInput): WeeklySnapshotViewModel {
  const nowMs = input.nowMs ?? Date.now();

  let posts: WeeklySnapshotMetricState;
  if (input.postsFailed) {
    posts = { state: 'unavailable' };
  } else if (input.postsLoading && input.posts.length === 0) {
    posts = { state: 'loading' };
  } else {
    posts = {
      state: 'ready',
      value: countPostsCreatedSince(input.posts, '7d', nowMs),
    };
  }

  const likes = mapEngagementMetric(input.engagementPeriod, 'likes');
  const comments = mapEngagementMetric(input.engagementPeriod, 'comments');
  const newFollowers = mapFollowersMetric(input.followersPeriod);

  return { posts, likes, comments, newFollowers };
}

function mapEngagementMetric(
  input: WeeklySnapshotEngagementPeriodInput,
  field: 'likes' | 'comments',
): WeeklySnapshotMetricState {
  switch (input.status) {
    case 'idle':
    case 'loading':
      return { state: 'loading' };
    case 'unavailable':
      return { state: 'unavailable' };
    case 'ready':
      return {
        state: 'ready',
        value: field === 'likes' ? input.likesReceived : input.commentsReceived,
      };
  }
}

function mapFollowersMetric(input: WeeklySnapshotFollowersPeriodInput): WeeklySnapshotMetricState {
  switch (input.status) {
    case 'idle':
    case 'loading':
      return { state: 'loading' };
    case 'unavailable':
      return { state: 'unavailable' };
    case 'ready':
      return { state: 'ready', value: input.followersGained };
  }
}
