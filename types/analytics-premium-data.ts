import type { AnalyticsMetricState } from '@/types/analytics-access';

/** View-model for Advanced Insights (backend TBD). */
export type AdvancedInsightsData = {
  profileViews: AnalyticsMetricState;
  impressions: AnalyticsMetricState;
  saves: AnalyticsMetricState;
  engagementRate: AnalyticsMetricState;
  likes: AnalyticsMetricState;
  comments: AnalyticsMetricState;
  followersGained: AnalyticsMetricState;
  performanceOverTime: 'loading' | 'unavailable';
  funnel: {
    impressions: AnalyticsMetricState;
    profileVisits: AnalyticsMetricState;
    savesAndFollows: AnalyticsMetricState;
  };
};

/** Static unavailable snapshot — no fabricated numbers. */
export const UNAVAILABLE_ADVANCED_INSIGHTS: AdvancedInsightsData = {
  profileViews: { state: 'unavailable' },
  impressions: { state: 'unavailable' },
  saves: { state: 'unavailable' },
  engagementRate: { state: 'unavailable' },
  likes: { state: 'unavailable' },
  comments: { state: 'unavailable' },
  followersGained: { state: 'unavailable' },
  performanceOverTime: 'unavailable',
  funnel: {
    impressions: { state: 'unavailable' },
    profileVisits: { state: 'unavailable' },
    savesAndFollows: { state: 'unavailable' },
  },
};

export type ContentInsightsPostRow = {
  id: string;
  title: string;
  postedAtLabel: string;
  imageUri: string | null;
  views: AnalyticsMetricState;
  saves: AnalyticsMetricState;
  likes: AnalyticsMetricState;
  comments: AnalyticsMetricState;
  engagement: AnalyticsMetricState;
};

export type ContentInsightsData = {
  topPosts: ContentInsightsPostRow[];
  bestFormat: AnalyticsMetricState;
  bestPostingTimes: AnalyticsMetricState;
  postingCadence: AnalyticsMetricState;
  opportunities: 'unavailable' | 'loading';
};

export type AudienceInsightsData = {
  totalFollowers: AnalyticsMetricState;
  followerGrowth: AnalyticsMetricState;
  returningEngagement: AnalyticsMetricState;
  newEngagement: AnalyticsMetricState;
  engagementByTime: 'unavailable' | 'loading';
  localActivity: 'unavailable' | 'loading';
};
