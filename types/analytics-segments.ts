export const ANALYTICS_SEGMENT_IDS = [
  'overview',
  'content',
  'audience',
  'intelligence',
  'more',
] as const;

export type AnalyticsSegmentId = (typeof ANALYTICS_SEGMENT_IDS)[number];

export type AnalyticsIntelligenceFocus = 'content_opportunities' | null;

export type AnalyticsSegmentDefinition = {
  id: AnalyticsSegmentId;
  /** Visible label on the segment pill */
  pillLabel: string;
  accessibilityLabel: string;
  variant: 'default' | 'intelligence';
};

export const ANALYTICS_SEGMENTS: AnalyticsSegmentDefinition[] = [
  { id: 'overview', pillLabel: 'Overview', accessibilityLabel: 'Overview', variant: 'default' },
  { id: 'content', pillLabel: 'Content', accessibilityLabel: 'Content', variant: 'default' },
  { id: 'audience', pillLabel: 'Audience', accessibilityLabel: 'Audience', variant: 'default' },
  {
    id: 'intelligence',
    pillLabel: 'Intelligence',
    accessibilityLabel: 'Competitive Intelligence',
    variant: 'intelligence',
  },
  { id: 'more', pillLabel: 'More', accessibilityLabel: 'More', variant: 'default' },
];
