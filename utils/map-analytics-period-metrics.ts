import type { BusinessAnalyticsPeriodMetrics } from '@/types/analytics-period-data';

export function mapEngagementPeriodPayload(payload: {
  likes_received: number | string;
  comments_received: number | string;
}): Pick<BusinessAnalyticsPeriodMetrics, 'likesReceived' | 'commentsReceived'> {
  return {
    likesReceived: coerceNonNegativeInt(payload.likes_received),
    commentsReceived: coerceNonNegativeInt(payload.comments_received),
  };
}

export function mapFollowerGrowthPeriodPayload(payload: {
  followers_gained: number | string;
}): Pick<BusinessAnalyticsPeriodMetrics, 'followersGained'> {
  return {
    followersGained: coerceNonNegativeInt(payload.followers_gained),
  };
}

export function mergeBusinessAnalyticsPeriodMetrics(
  engagement: Pick<BusinessAnalyticsPeriodMetrics, 'likesReceived' | 'commentsReceived'>,
  followers: Pick<BusinessAnalyticsPeriodMetrics, 'followersGained'>,
): BusinessAnalyticsPeriodMetrics {
  return {
    likesReceived: engagement.likesReceived,
    commentsReceived: engagement.commentsReceived,
    followersGained: followers.followersGained,
  };
}

function coerceNonNegativeInt(value: number | string): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.floor(numeric));
}
