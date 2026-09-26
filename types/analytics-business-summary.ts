import type { AnalyticsTimeRangeId } from '@/types/analytics-time-range';

/** Summary period matches the selected Analytics time range. */
export type AnalyticsSummaryPeriodId = AnalyticsTimeRangeId;

export type PremiumBusinessSummaryChip = {
  id: string;
  label: string;
};

export type PremiumBusinessSummaryAvailability =
  | { state: 'loading' }
  | { state: 'ready'; body: string; chips: PremiumBusinessSummaryChip[] }
  | { state: 'sparse'; body: string; chips: PremiumBusinessSummaryChip[] };

export type PremiumBusinessSummaryViewModel = {
  periodId: AnalyticsSummaryPeriodId;
  periodLabel: string;
  availability: PremiumBusinessSummaryAvailability;
  /** Stable key for typewriter replay when derived text changes. */
  contentKey: string;
};
