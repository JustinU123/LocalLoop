/**
 * Analytics capability helpers (no test runner dependency).
 * Run: npx tsx scripts/run-analytics-access-tests.ts
 */

import {
  getAnalyticsFeatureAccess,
  hasAnalyticsCapability,
  resolveAnalyticsPlanTier,
} from '../utils/analytics-access';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  assert(resolveAnalyticsPlanTier() === 'basic', 'default tier should be basic');
  assert(
    resolveAnalyticsPlanTier({ subscriptionTier: null }) === 'basic',
    'null subscription should be basic',
  );
  assert(
    resolveAnalyticsPlanTier({ subscriptionTier: 'premium' }) === 'premium',
    'explicit premium from subscription',
  );

  assert(hasAnalyticsCapability('basic', 'analytics.basic'), 'basic has analytics.basic');
  assert(hasAnalyticsCapability('basic', 'analytics.engagement_likes'), 'basic has engagement likes');
  assert(
    hasAnalyticsCapability('basic', 'analytics.engagement_comments'),
    'basic has engagement comments',
  );
  assert(!hasAnalyticsCapability('basic', 'analytics.advanced_insights'), 'basic lacks advanced');
  assert(hasAnalyticsCapability('pro', 'analytics.performance'), 'pro has performance');
  assert(!hasAnalyticsCapability('pro', 'analytics.content_insights'), 'pro lacks content insights');
  assert(
    hasAnalyticsCapability('premium', 'analytics.content_opportunities'),
    'premium has content opportunities',
  );
  assert(
    hasAnalyticsCapability('premium', 'analytics.competitive_intelligence'),
    'premium has competitive intelligence',
  );
  assert(
    !hasAnalyticsCapability('basic', 'analytics.competitive_intelligence'),
    'basic lacks competitive intelligence',
  );

  assert(
    getAnalyticsFeatureAccess('basic', 'analytics.advanced_insights') === 'locked',
    'advanced locked for basic',
  );
  assert(
    getAnalyticsFeatureAccess('premium', 'analytics.advanced_insights') === 'unlocked',
    'advanced unlocked for premium',
  );

  console.log('analytics-access: all checks passed');
}

run();
