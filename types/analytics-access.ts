/** Fine-grained analytics capabilities (map to Basic / Pro / Premium later). */
export const ANALYTICS_CAPABILITIES = [
  'analytics.basic',
  /** Raw like counts on published posts — all business tiers */
  'analytics.engagement_likes',
  /** Raw comment counts on published posts — all business tiers */
  'analytics.engagement_comments',
  'analytics.performance',
  'analytics.advanced_insights',
  'analytics.content_insights',
  'analytics.audience_insights',
  'analytics.local_benchmarking',
  'analytics.potential_reach',
  'analytics.content_opportunities',
  'analytics.competitive_intelligence',
] as const;

export type AnalyticsCapability = (typeof ANALYTICS_CAPABILITIES)[number];

export type AnalyticsPlanTier = 'basic' | 'pro' | 'premium';

export type AnalyticsFeatureAccess = 'locked' | 'unlocked';

export type AnalyticsMetricState =
  | { state: 'loading' }
  | { state: 'unavailable' }
  | { state: 'ready'; value: number };
