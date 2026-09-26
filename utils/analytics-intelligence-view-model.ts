import {
  UNAVAILABLE_BUSINESS_SUMMARY,
  UNAVAILABLE_CONTENT_OPPORTUNITIES,
  UNAVAILABLE_LOCAL_MARKET,
  UNAVAILABLE_POTENTIAL_REACH,
  type BusinessSummaryData,
  type ContentOpportunitiesData,
  type LocalMarketIntelligenceData,
  type PotentialReachData,
} from '@/types/analytics-intelligence-data';

export function getBusinessSummaryViewModel(loading: boolean): BusinessSummaryData {
  if (loading) {
    return { ...UNAVAILABLE_BUSINESS_SUMMARY, headline: 'loading' };
  }
  return UNAVAILABLE_BUSINESS_SUMMARY;
}

export function getPotentialReachViewModel(loading: boolean): PotentialReachData {
  if (loading) {
    return {
      ...UNAVAILABLE_POTENTIAL_REACH,
      currentReach: { state: 'loading' },
      potentialReach: { state: 'loading' },
      meterState: 'loading',
      recommendations: UNAVAILABLE_POTENTIAL_REACH.recommendations.map((r) => ({
        ...r,
        state: 'loading' as const,
      })),
    };
  }
  return UNAVAILABLE_POTENTIAL_REACH;
}

export function getContentOpportunitiesViewModel(loading: boolean): ContentOpportunitiesData {
  if (loading) {
    return {
      opportunities: UNAVAILABLE_CONTENT_OPPORTUNITIES.opportunities.map((o) => ({
        ...o,
        state: 'loading' as const,
        signal: { state: 'loading' as const },
      })),
    };
  }
  return UNAVAILABLE_CONTENT_OPPORTUNITIES;
}

export function getLocalMarketViewModel(loading: boolean): LocalMarketIntelligenceData {
  if (loading) {
    return {
      ...UNAVAILABLE_LOCAL_MARKET,
      benchmark: {
        engagementRange: { state: 'loading' },
        postingFrequency: { state: 'loading' },
        categoryActivity: { state: 'loading' },
        relativePatterns: { state: 'loading' },
      },
      similarBusinesses: UNAVAILABLE_LOCAL_MARKET.similarBusinesses.map((b) => ({
        ...b,
        state: 'loading' as const,
      })),
      publicContentExamples: UNAVAILABLE_LOCAL_MARKET.publicContentExamples.map((e) => ({
        ...e,
        state: 'loading' as const,
      })),
    };
  }
  return UNAVAILABLE_LOCAL_MARKET;
}
