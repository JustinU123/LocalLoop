import type { AnalyticsTimeRangeId } from '@/types/analytics-time-range';

export type ProPerformanceCoachState = 'loading' | 'insufficient_data' | 'ready';

export type ProPerformanceCoachViewModel = {
  state: ProPerformanceCoachState;
  selectedRangeId: AnalyticsTimeRangeId;
  headline: string;
  explanation: string;
  nextMove: string;
  /** Short line describing what the coach used (e.g. selected period, post count). */
  evidenceLabel: string;
};

export type ProPerformanceSummaryMetricId =
  | 'profile_views'
  | 'impressions'
  | 'saves'
  | 'engagement_rate'
  | 'likes'
  | 'comments';

export type ProPerformanceSummaryMetricDefinition = {
  id: ProPerformanceSummaryMetricId;
  label: string;
  icon:
    | 'eye-outline'
    | 'images-outline'
    | 'bookmark-outline'
    | 'stats-chart-outline'
    | 'heart-outline'
    | 'chatbubble-outline';
  iconTone: 'emerald' | 'coral' | 'amber' | 'teal' | 'blue';
  availability: 'ready' | 'unavailable';
  unavailableHint: string;
};

export const PRO_PERFORMANCE_SUMMARY_METRICS: ProPerformanceSummaryMetricDefinition[] = [
  {
    id: 'profile_views',
    label: 'Profile Views',
    icon: 'eye-outline',
    iconTone: 'emerald',
    availability: 'unavailable',
    unavailableHint: 'View tracking is not live yet.',
  },
  {
    id: 'impressions',
    label: 'Impressions',
    icon: 'images-outline',
    iconTone: 'coral',
    availability: 'unavailable',
    unavailableHint: 'Impression tracking is not live yet.',
  },
  {
    id: 'saves',
    label: 'Saves',
    icon: 'bookmark-outline',
    iconTone: 'amber',
    availability: 'unavailable',
    unavailableHint: 'Save analytics are not aggregated yet.',
  },
  {
    id: 'engagement_rate',
    label: 'Engagement Rate',
    icon: 'stats-chart-outline',
    iconTone: 'teal',
    availability: 'unavailable',
    unavailableHint: 'Engagement rate requires view and interaction events.',
  },
  {
    id: 'likes',
    label: 'Likes',
    icon: 'heart-outline',
    iconTone: 'coral',
    availability: 'ready',
    unavailableHint: 'Unable to load likes right now.',
  },
  {
    id: 'comments',
    label: 'Comments',
    icon: 'chatbubble-outline',
    iconTone: 'blue',
    availability: 'ready',
    unavailableHint: 'Unable to load comments right now.',
  },
];
