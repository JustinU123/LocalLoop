/**
 * Dev tier override store + effective tier (no test runner dependency).
 * Run: npx tsx scripts/run-analytics-dev-tier-preview-tests.ts
 */

import { hasAnalyticsCapability } from '../utils/analytics-access';
import {
  getAnalyticsDevTierOverride,
  getAnalyticsEffectivePlanTier,
  setAnalyticsDevTierOverride,
  subscribeAnalyticsEffectivePlanTier,
} from '../utils/analytics-dev-tier-preview';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;

  setAnalyticsDevTierOverride(null);
  assert(getAnalyticsDevTierOverride() === null, 'initial override should be null');
  assert(getAnalyticsEffectivePlanTier() === 'basic', 'null override resolves to basic');

  let notifications = 0;
  const unsubscribe = subscribeAnalyticsEffectivePlanTier(() => {
    notifications += 1;
  });

  setAnalyticsDevTierOverride('pro');
  assert(getAnalyticsDevTierOverride() === 'pro', 'pro override stored');
  assert(getAnalyticsEffectivePlanTier() === 'pro', 'effective tier pro');
  assert(hasAnalyticsCapability(getAnalyticsEffectivePlanTier(), 'analytics.performance'), 'pro has performance');
  assert(notifications === 1, 'subscriber notified on pro');

  setAnalyticsDevTierOverride('premium');
  assert(getAnalyticsEffectivePlanTier() === 'premium', 'effective tier premium');
  assert(
    hasAnalyticsCapability(getAnalyticsEffectivePlanTier(), 'analytics.competitive_intelligence'),
    'premium has competitive intelligence',
  );
  assert(notifications === 2, 'subscriber notified on premium');

  setAnalyticsDevTierOverride(null);
  assert(getAnalyticsEffectivePlanTier() === 'basic', 'cleared override back to basic');
  assert(notifications === 3, 'subscriber notified on basic reset');

  unsubscribe();
  setAnalyticsDevTierOverride('pro');
  assert(notifications === 3, 'unsubscribed listener should not fire');

  setAnalyticsDevTierOverride(null);

  console.log('analytics-dev-tier-preview: all checks passed');
}

run();
