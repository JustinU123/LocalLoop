import type { AnalyticsMetricState } from '@/types/analytics-access';

export type IntelligenceInsightSlot = {
  label: string;
  body: AnalyticsMetricState | { state: 'unavailable' | 'loading'; message?: string };
};

export type BusinessSummaryData = {
  headline: 'unavailable' | 'loading';
  strongestSignal: IntelligenceInsightSlot;
  opportunity: IntelligenceInsightSlot;
  localContext: IntelligenceInsightSlot;
};

export type ReachRecommendationSlot = {
  id: string;
  title: string;
  description: string;
  state: 'unavailable' | 'loading';
};

export type PotentialReachData = {
  currentReach: AnalyticsMetricState;
  potentialReach: AnalyticsMetricState;
  meterState: 'unavailable' | 'loading';
  recommendations: ReachRecommendationSlot[];
};

export type ContentOpportunityType =
  | 'underrepresented_nearby'
  | 'local_interest'
  | 'timing_opportunity';

export type ContentOpportunityCardData = {
  id: string;
  type: ContentOpportunityType;
  title: string;
  typeLabel: string;
  explanation: string;
  whyItMatters: string;
  signal: AnalyticsMetricState;
  state: 'unavailable' | 'loading';
};

export type ContentOpportunitiesData = {
  opportunities: ContentOpportunityCardData[];
};

export type LocalBenchmarkData = {
  engagementRange: AnalyticsMetricState;
  postingFrequency: AnalyticsMetricState;
  categoryActivity: AnalyticsMetricState;
  relativePatterns: AnalyticsMetricState;
};

export type SimilarBusinessSlot = {
  id: string;
  name: string;
  categoryLabel: string;
  state: 'unavailable' | 'loading';
};

export type PublicContentExample = {
  id: string;
  businessLabel: string;
  captionPreview: string;
  state: 'unavailable' | 'loading';
};

export type LocalMarketIntelligenceData = {
  benchmark: LocalBenchmarkData;
  similarBusinesses: SimilarBusinessSlot[];
  publicContentExamples: PublicContentExample[];
};

export const UNAVAILABLE_BUSINESS_SUMMARY: BusinessSummaryData = {
  headline: 'unavailable',
  strongestSignal: {
    label: 'Strongest signal',
    body: { state: 'unavailable' },
  },
  opportunity: {
    label: 'Opportunity',
    body: { state: 'unavailable' },
  },
  localContext: {
    label: 'Local position',
    body: { state: 'unavailable' },
  },
};

export const UNAVAILABLE_POTENTIAL_REACH: PotentialReachData = {
  currentReach: { state: 'unavailable' },
  potentialReach: { state: 'unavailable' },
  meterState: 'unavailable',
  recommendations: [
    {
      id: 'posting-timing',
      title: 'Post when local activity is stronger',
      description: 'Recommendations appear when regional engagement patterns are available.',
      state: 'unavailable',
    },
    {
      id: 'content-format',
      title: 'Try underused content formats',
      description: 'Format guidance requires category-level content signals.',
      state: 'unavailable',
    },
    {
      id: 'profile-content',
      title: 'Strengthen profile and content fit',
      description: 'Profile improvements surface when completeness and demand signals align.',
      state: 'unavailable',
    },
  ],
};

export const UNAVAILABLE_CONTENT_OPPORTUNITIES: ContentOpportunitiesData = {
  opportunities: [
    {
      id: 'underrepresented',
      type: 'underrepresented_nearby',
      typeLabel: 'Underrepresented nearby',
      title: 'Underserved local topics',
      explanation:
        'LocalLoop will highlight gaps where few businesses in your category cover relevant topics.',
      whyItMatters: 'Differentiation matters more than copying what is already saturated locally.',
      signal: { state: 'unavailable' },
      state: 'unavailable',
    },
    {
      id: 'local-interest',
      type: 'local_interest',
      typeLabel: 'Local interest',
      title: 'Rising local engagement signals',
      explanation: 'Signals appear when category or topic interest increases in your area.',
      whyItMatters: 'Timing content with genuine local demand can improve relevance.',
      signal: { state: 'unavailable' },
      state: 'unavailable',
    },
    {
      id: 'timing',
      type: 'timing_opportunity',
      typeLabel: 'Timing opportunity',
      title: 'Strong activity windows',
      explanation:
        'Compares when your audience engages locally vs when you typically post.',
      whyItMatters: 'Cadence aligned with local activity can improve discovery.',
      signal: { state: 'unavailable' },
      state: 'unavailable',
    },
  ],
};

export const UNAVAILABLE_LOCAL_MARKET: LocalMarketIntelligenceData = {
  benchmark: {
    engagementRange: { state: 'unavailable' },
    postingFrequency: { state: 'unavailable' },
    categoryActivity: { state: 'unavailable' },
    relativePatterns: { state: 'unavailable' },
  },
  similarBusinesses: [
    {
      id: 'similar-1',
      name: 'Similar businesses',
      categoryLabel: 'Your category',
      state: 'unavailable',
    },
  ],
  publicContentExamples: [
    { id: 'pub-1', businessLabel: 'Public example', captionPreview: '—', state: 'unavailable' },
    { id: 'pub-2', businessLabel: 'Public example', captionPreview: '—', state: 'unavailable' },
    { id: 'pub-3', businessLabel: 'Public example', captionPreview: '—', state: 'unavailable' },
  ],
};
