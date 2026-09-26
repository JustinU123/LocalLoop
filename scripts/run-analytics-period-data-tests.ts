/**
 * Run: npx tsx scripts/run-analytics-period-data-tests.ts
 *
 * SQL/manual scenarios (apply migration 20260927_owner_period_analytics.sql first):
 * A) Like today on old post → included in 7D period_start
 * B) Like before period_start → excluded
 * C) Active comment in window → included
 * D) Soft-deleted comment → excluded (deleted_at IS NULL filter)
 * E) Follow in window → followers_gained counts
 * F) Follow before period_start → excluded
 * G) Non-owner caller → RPC returns NULL → service forbidden
 * H) get_business_post_engagement_for_owner unchanged (lifetime)
 */

import {
  getAnalyticsTimeRangePeriodStartIso,
  getAnalyticsTimeRangeStartMs,
} from '../utils/analytics-time-range';
import {
  mapEngagementPeriodPayload,
  mapFollowerGrowthPeriodPayload,
  mergeBusinessAnalyticsPeriodMetrics,
} from '../utils/map-analytics-period-metrics';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const NOW = new Date('2026-09-25T12:00:00.000Z').getTime();
const MS_DAY = 24 * 60 * 60 * 1000;

function run() {
  const iso7d = getAnalyticsTimeRangePeriodStartIso('7d', NOW);
  const start7dMs = getAnalyticsTimeRangeStartMs('7d', NOW);
  assert(iso7d === new Date(start7dMs).toISOString(), 'period ISO matches start ms');

  for (const id of ['1d', '7d', '1m', '3m', '6m', '1y'] as const) {
    const iso = getAnalyticsTimeRangePeriodStartIso(id, NOW);
    assert(iso.length > 0, `${id} produces ISO period start`);
    assert(new Date(iso).getTime() < NOW, `${id} start is before now`);
  }

  const engagement = mapEngagementPeriodPayload({
    likes_received: '3',
    comments_received: 2,
  });
  assert(engagement.likesReceived === 3 && engagement.commentsReceived === 2, 'engagement map');

  const followers = mapFollowerGrowthPeriodPayload({ followers_gained: '-1' });
  assert(followers.followersGained === 0, 'negative coerced to zero');

  const merged = mergeBusinessAnalyticsPeriodMetrics(
    { likesReceived: 1, commentsReceived: 0 },
    { followersGained: 4 },
  );
  assert(
    merged.likesReceived === 1 &&
      merged.commentsReceived === 0 &&
      merged.followersGained === 4,
    'merge metrics',
  );

  const likeAt = new Date(NOW - 2 * MS_DAY);
  const likeOld = new Date(NOW - 10 * MS_DAY);
  assert(likeAt.getTime() >= start7dMs, 'scenario A: recent like in 7d window');
  assert(likeOld.getTime() < start7dMs, 'scenario B: old like outside 7d window');

  console.log('analytics-period-data: all checks passed');
}

run();
