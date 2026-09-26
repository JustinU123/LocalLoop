/**
 * Run: npx tsx scripts/run-premium-business-summary-tests.ts
 */

import { buildPremiumBusinessSummary } from '../utils/build-premium-business-summary';
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
  const loading = buildPremiumBusinessSummary(
    {
      selectedPeriod: '7d',
      loading: true,
      totalFollowers: null,
      followersFailed: false,
      followersGainedInPeriod: null,
      posts: [],
      postsFailed: false,
      totalLikes: null,
      totalComments: null,
      engagementFailed: false,
    },
    NOW,
  );
  assert(loading.availability.state === 'loading', 'loading state');

  const oneFollower = buildPremiumBusinessSummary(
    {
      selectedPeriod: '7d',
      loading: false,
      totalFollowers: 1,
      followersFailed: false,
      followersGainedInPeriod: null,
      posts: [],
      postsFailed: false,
      totalLikes: 0,
      totalComments: 0,
      engagementFailed: false,
    },
    NOW,
  );
  assert(oneFollower.availability.state === 'sparse' || oneFollower.availability.state === 'ready', 'one follower');
  if (oneFollower.availability.state === 'ready') {
    assert(
      oneFollower.availability.body.includes('1 follower'),
      'uses total followers when period growth unavailable',
    );
  }

  const threePosts = buildPremiumBusinessSummary(
    {
      selectedPeriod: '7d',
      loading: false,
      totalFollowers: 1,
      followersFailed: false,
      followersGainedInPeriod: null,
      posts: [
        post('a', '2026-09-24T10:00:00.000Z'),
        post('b', '2026-09-23T10:00:00.000Z'),
        post('c', '2026-09-22T10:00:00.000Z'),
      ],
      postsFailed: false,
      totalLikes: 0,
      totalComments: 0,
      engagementFailed: false,
    },
    NOW,
  );
  assert(threePosts.availability.state === 'ready', 'ready with posts');

  const withEngagement = buildPremiumBusinessSummary(
    {
      selectedPeriod: '7d',
      loading: false,
      totalFollowers: 2,
      followersFailed: false,
      followersGainedInPeriod: null,
      posts: [post('a', '2026-09-24T10:00:00.000Z')],
      postsFailed: false,
      totalLikes: 4,
      totalComments: 2,
      engagementFailed: false,
    },
    NOW,
  );
  assert(withEngagement.availability.state === 'ready', 'ready with engagement');
  if (withEngagement.availability.state === 'ready') {
    assert(
      withEngagement.availability.body.includes('4 likes') &&
        withEngagement.availability.body.includes('2 comments'),
      'mentions current likes and comments',
    );
    assert(
      !/likes in the past 7 days/i.test(withEngagement.availability.body),
      'no fake period likes',
    );
  }
  if (threePosts.availability.state === 'ready') {
    assert(threePosts.availability.body.includes('3 posts'), 'mentions three posts in period');
    assert(
      threePosts.availability.chips.some((c) => c.label.includes('3 Posts this week')),
      'chip for period posts',
    );
  }

  const oneMonth = buildPremiumBusinessSummary(
    {
      selectedPeriod: '1m',
      loading: false,
      totalFollowers: 1,
      followersFailed: false,
      followersGainedInPeriod: null,
      posts: [
        post('a', '2026-09-24T10:00:00.000Z'),
        post('b', '2026-08-27T10:00:00.000Z'),
        post('c', '2026-06-01T10:00:00.000Z'),
      ],
      postsFailed: false,
      totalLikes: 0,
      totalComments: 0,
      engagementFailed: false,
    },
    NOW,
  );
  if (oneMonth.availability.state === 'ready') {
    assert(
      oneMonth.availability.body.includes('past 30 days'),
      '1m period copy',
    );
    assert(
      oneMonth.availability.body.includes('2 posts'),
      '1m counts posts in 30d window only',
    );
  }

  console.log('premium-business-summary: all checks passed');
}

run();
