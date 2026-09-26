import type {
  AnalyticsCapability,
  AnalyticsFeatureAccess,
  AnalyticsPlanTier,
} from '@/types/analytics-access';

const ENGAGEMENT_CAPABILITIES: AnalyticsCapability[] = [
  'analytics.engagement_likes',
  'analytics.engagement_comments',
];

const ALL_CAPABILITIES: AnalyticsCapability[] = [
  'analytics.basic',
  ...ENGAGEMENT_CAPABILITIES,
  'analytics.performance',
  'analytics.advanced_insights',
  'analytics.content_insights',
  'analytics.audience_insights',
  'analytics.local_benchmarking',
  'analytics.potential_reach',
  'analytics.content_opportunities',
  'analytics.competitive_intelligence',
];

/** Pro capability set is intentionally minimal until product finalizes entitlements. */
const PRO_CAPABILITIES: AnalyticsCapability[] = [
  'analytics.basic',
  ...ENGAGEMENT_CAPABILITIES,
  'analytics.performance',
];

const TIER_CAPABILITIES: Record<AnalyticsPlanTier, ReadonlySet<AnalyticsCapability>> = {
  basic: new Set(['analytics.basic', ...ENGAGEMENT_CAPABILITIES]),
  pro: new Set(PRO_CAPABILITIES),
  premium: new Set(ALL_CAPABILITIES),
};

/**
 * Resolves analytics plan tier. Defaults to Basic until subscription entitlements exist.
 * Do not infer paid tiers from UI state alone.
 */
export function resolveAnalyticsPlanTier(_params?: {
  /** Future: subscription record from Supabase */
  subscriptionTier?: AnalyticsPlanTier | null;
  /** __DEV__ only in-memory preview; never persisted */
  devTierOverride?: AnalyticsPlanTier | null;
}): AnalyticsPlanTier {
  const devOverride = _params?.devTierOverride;
  if (typeof __DEV__ !== 'undefined' && __DEV__ && devOverride) {
    return devOverride;
  }

  const fromSubscription = _params?.subscriptionTier;
  if (fromSubscription === 'pro' || fromSubscription === 'premium') {
    return fromSubscription;
  }
  return 'basic';
}

export function analyticsCapabilitiesForTier(tier: AnalyticsPlanTier): ReadonlySet<AnalyticsCapability> {
  return TIER_CAPABILITIES[tier];
}

export function hasAnalyticsCapability(
  tier: AnalyticsPlanTier,
  capability: AnalyticsCapability,
): boolean {
  return TIER_CAPABILITIES[tier].has(capability);
}

export function getAnalyticsFeatureAccess(
  tier: AnalyticsPlanTier,
  capability: AnalyticsCapability,
): AnalyticsFeatureAccess {
  return hasAnalyticsCapability(tier, capability) ? 'unlocked' : 'locked';
}
