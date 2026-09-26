/**
 * Run: npx tsx scripts/run-weekly-snapshot-tests.ts
 */

import { hasAnalyticsCapability } from '../utils/analytics-access';
import { showBasicWeeklySnapshot } from '../utils/analytics-panel-routing';
import {
  buildWeeklySnapshot,
  formatWeeklySnapshotMetricDisplay,
} from '../utils/build-weekly-snapshot';
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
  assert(showBasicWeeklySnapshot((c) => hasAnalyticsCapability('basic', c)), 'basic shows snapshot');
  assert(!showBasicWeeklySnapshot((c) => hasAnalyticsCapability('pro', c)), 'pro hides snapshot');
  assert(
    !showBasicWeeklySnapshot((c) => hasAnalyticsCapability('premium', c)),
    'premium hides snapshot',
  );

  const zeros = buildWeeklySnapshot({
    postsLoading: false,
    postsFailed: false,
    posts: [],
    engagementPeriod: { status: 'ready', likesReceived: 0, commentsReceived: 0 },
    followersPeriod: { status: 'ready', followersGained: 0 },
    nowMs: NOW,
  });
  assert(zeros.posts.state === 'ready' && zeros.posts.value === 0, 'A: zero posts');
  assert(formatWeeklySnapshotMetricDisplay(zeros.likes) === '0', 'A: zero likes display');

  const multiPosts = buildWeeklySnapshot({
    postsLoading: false,
    postsFailed: false,
    posts: [
      post('a', new Date(NOW - 2 * MS_DAY).toISOString()),
      post('b', new Date(NOW - 5 * MS_DAY).toISOString()),
    ],
    engagementPeriod: { status: 'ready', likesReceived: 2, commentsReceived: 1 },
    followersPeriod: { status: 'ready', followersGained: 3 },
    nowMs: NOW,
  });
  assert(multiPosts.posts.state === 'ready' && multiPosts.posts.value === 2, 'B: two posts in 7d');

  const oldPostExcluded = buildWeeklySnapshot({
    postsLoading: false,
    postsFailed: false,
    posts: [post('old', new Date(NOW - 10 * MS_DAY).toISOString())],
    engagementPeriod: { status: 'ready', likesReceived: 5, commentsReceived: 0 },
    followersPeriod: { status: 'ready', followersGained: 0 },
    nowMs: NOW,
  });
  assert(oldPostExcluded.posts.state === 'ready' && oldPostExcluded.posts.value === 0, 'C: old post excluded');

  assert(
    oldPostExcluded.likes.state === 'ready' && oldPostExcluded.likes.value === 5,
    'D: period likes independent of post age',
  );

  assert(
    multiPosts.newFollowers.state === 'ready' && multiPosts.newFollowers.value === 3,
    'E: followers gained',
  );

  const partialEngagement = buildWeeklySnapshot({
    postsLoading: false,
    postsFailed: false,
    posts: [],
    engagementPeriod: { status: 'unavailable' },
    followersPeriod: { status: 'ready', followersGained: 1 },
    nowMs: NOW,
  });
  assert(partialEngagement.likes.state === 'unavailable', 'F: engagement failure');
  assert(formatWeeklySnapshotMetricDisplay(partialEngagement.likes) === '—', 'F: em dash likes');
  assert(
    partialEngagement.newFollowers.state === 'ready' &&
      partialEngagement.newFollowers.value === 1,
    'F: followers still shown',
  );

  const followerFail = buildWeeklySnapshot({
    postsLoading: false,
    postsFailed: false,
    posts: [],
    engagementPeriod: { status: 'ready', likesReceived: 1, commentsReceived: 0 },
    followersPeriod: { status: 'unavailable' },
    nowMs: NOW,
  });
  assert(followerFail.newFollowers.state === 'unavailable', 'G: follower failure');

  const postsFail = buildWeeklySnapshot({
    postsLoading: false,
    postsFailed: true,
    posts: [],
    engagementPeriod: { status: 'ready', likesReceived: 0, commentsReceived: 0 },
    followersPeriod: { status: 'ready', followersGained: 0 },
    nowMs: NOW,
  });
  assert(postsFail.posts.state === 'unavailable', 'H: posts unavailable');

  assert(formatWeeklySnapshotMetricDisplay({ state: 'ready', value: 0 }) === '0', 'I: zero vs dash');
  assert(formatWeeklySnapshotMetricDisplay({ state: 'unavailable' }) === '—', 'I: unavailable dash');

  console.log('weekly-snapshot: all checks passed');
}

run();
