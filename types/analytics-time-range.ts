/** Canonical Analytics time ranges (Overview period selection). */
export const ANALYTICS_TIME_RANGE_IDS = ['1d', '7d', '1m', '3m', '6m', '1y'] as const;

export type AnalyticsTimeRangeId = (typeof ANALYTICS_TIME_RANGE_IDS)[number];

export const DEFAULT_ANALYTICS_TIME_RANGE_ID: AnalyticsTimeRangeId = '7d';

export type AnalyticsTimeRangeDefinition = {
  id: AnalyticsTimeRangeId;
  /** Compact label in the selector control (e.g. 7D). */
  selectorLabel: string;
  /** Pill copy (e.g. Last 7 Days). */
  pillLabel: string;
  /** Phrase for summary sentences (e.g. past 7 days). */
  summaryPeriodPhrase: string;
  /** Short phrase for metric chips (e.g. this week). */
  chipPeriodPhrase: string;
  /** Rolling window length in milliseconds. */
  durationMs: number;
};
