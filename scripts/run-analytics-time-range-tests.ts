/**
 * Run: npx tsx scripts/run-analytics-time-range-tests.ts
 */

import { buildPremiumBusinessSummary } from '../utils/build-premium-business-summary';
import {
  countPostsCreatedSince,
  getAnalyticsTimeRangeDefinition,
  getAnalyticsTimeRangePeriodStartIso,
  getAnalyticsTimeRangeStartMs,
} from '../utils/analytics-time-range';
import type { BusinessPost } from '../types/supabase-post';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const NOW = new Date('2026-09-25T12:00:00.000Z').getTime();
const MS_DAY = 24 * 60 * 60 * 1000;

function post(id: string, createdAt: string): BusinessPost {
  return {
    id,
    businessId: 'biz',
    postType: 'photo',
    caption: null,
    imageUrl: null,
    status: 'published',
    createdAt,
  };
}

function run() {
  assert(getAnalyticsTimeRangeDefinition('7d').pillLabel === 'Last 7 Days', '7d pill label');
  assert(
    getAnalyticsTimeRangeStartMs('7d', NOW) === NOW - 7 * MS_DAY,
    '7d start ms',
  );
  assert(
    getAnalyticsTimeRangePeriodStartIso('7d', NOW) === new Date(NOW - 7 * MS_DAY).toISOString(),
    '7d period start ISO',
  );
  assert(
    getAnalyticsTimeRangeStartMs('1d', NOW) === NOW - MS_DAY,
    '1d start ms',
  );
  assert(
    getAnalyticsTimeRangeStartMs('1m', NOW) === NOW - 30 * MS_DAY,
    '1m start ms',
  );
  assert(
    getAnalyticsTimeRangeStartMs('1y', NOW) === NOW - 365 * MS_DAY,
    '1y start ms',
  );

  const posts = [
    post('recent', '2026-09-24T10:00:00.000Z'),
    post('week', '2026-09-18T10:00:00.000Z'),
    post('quarter', '2026-07-15T10:00:00.000Z'),
  ];

  assert(countPostsCreatedSince(posts, '7d', NOW) === 1, '7d post count (rolling window from now)');
  assert(countPostsCreatedSince(posts, '1m', NOW) === 2, '1m includes week-old post');
  assert(countPostsCreatedSince(posts, '3m', NOW) === 3, '3m includes june post');

  const summary30d = buildPremiumBusinessSummary(
    {
      selectedPeriod: '1m',
      loading: false,
      totalFollowers: 1,
      followersFailed: false,
      followersGainedInPeriod: null,
      posts,
      postsFailed: false,
      totalLikes: 0,
      totalComments: 0,
      engagementFailed: false,
    },
    NOW,
  );
  assert(summary30d.periodLabel === 'past 30 days', 'summary period label from range');
  if (summary30d.availability.state === 'ready') {
    assert(
      summary30d.availability.body.includes('2 posts in the past 30 days'),
      '30d post sentence uses real count',
    );
    assert(
      summary30d.availability.chips.some((c) => c.label.includes('2 Posts this month')),
      '30d chip phrase',
    );
  }

  const summary7d = buildPremiumBusinessSummary(
    {
      selectedPeriod: '7d',
      loading: false,
      totalFollowers: 1,
      followersFailed: false,
      followersGainedInPeriod: null,
      posts,
      postsFailed: false,
      totalLikes: 0,
      totalComments: 0,
      engagementFailed: false,
    },
    NOW,
  );
  if (summary7d.availability.state === 'ready') {
    assert(
      summary7d.availability.body.includes('1 post in the past 7 days'),
      '7d post count differs from 30d',
    );
  }

  console.log('analytics-time-range: all checks passed');
}

run();
