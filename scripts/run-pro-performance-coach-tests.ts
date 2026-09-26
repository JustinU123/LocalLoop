/**
 * Run: npx tsx scripts/run-pro-performance-coach-tests.ts
 */

import { buildProPerformanceCoach } from '../utils/build-pro-performance-coach';
import { usesPremiumAnalyticsPanels, usesProAnalyticsPanels } from '../utils/analytics-panel-routing';
import { hasAnalyticsCapability } from '../utils/analytics-access';
import type { BusinessPost } from '../types/supabase-post';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const NOW = new Date('2026-09-25T12:00:00.000Z').getTime();

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
  assert(usesProAnalyticsPanels((c) => hasAnalyticsCapability('pro', c)), 'pro uses pro panels');
  assert(!usesProAnalyticsPanels((c) => hasAnalyticsCapability('premium', c)), 'premium not pro panels');
  assert(usesPremiumAnalyticsPanels((c) => hasAnalyticsCapability('premium', c)), 'premium uses premium panels');

  const loading = buildProPerformanceCoach(
    {
      selectedRangeId: '7d',
      loading: true,
      posts: [],
      postsFailed: false,
      engagement: null,
      engagementFailed: false,
      totalFollowers: null,
      followersFailed: false,
    },
    NOW,
  );
  assert(loading.state === 'loading', 'loading state');

  const noPosts = buildProPerformanceCoach(
    {
      selectedRangeId: '1m',
      loading: false,
      posts: [],
      postsFailed: false,
      engagement: { totalLikes: 0, totalComments: 0, byPostId: {} },
      engagementFailed: false,
      totalFollowers: 0,
      followersFailed: false,
    },
    NOW,
  );
  assert(noPosts.state === 'insufficient_data', 'no posts insufficient');
  assert(noPosts.headline.includes('Keep building'), 'honest insufficient headline');

  const withPostNoEngagement = buildProPerformanceCoach(
    {
      selectedRangeId: '7d',
      loading: false,
      posts: [post('a', '2026-09-24T10:00:00.000Z')],
      postsFailed: false,
      engagement: { totalLikes: 0, totalComments: 0, byPostId: { a: { postId: 'a', likeCount: 0, commentCount: 0 } } },
      engagementFailed: false,
      totalFollowers: 1,
      followersFailed: false,
    },
    NOW,
  );
  assert(withPostNoEngagement.state === 'ready', 'post without engagement ready');
  assert(!withPostNoEngagement.nextMove.includes('best posting'), 'no fake timing advice');

  const withEngagement = buildProPerformanceCoach(
    {
      selectedRangeId: '7d',
      loading: false,
      posts: [post('a', '2026-09-24T10:00:00.000Z')],
      postsFailed: false,
      engagement: { totalLikes: 2, totalComments: 1, byPostId: { a: { postId: 'a', likeCount: 2, commentCount: 1 } } },
      engagementFailed: false,
      totalFollowers: 3,
      followersFailed: false,
    },
    NOW,
  );
  assert(withEngagement.state === 'ready', 'engagement ready');
  assert(withEngagement.explanation.includes('2 likes'), 'mentions real totals');

  console.log('pro-performance-coach: all checks passed');
}

run();
