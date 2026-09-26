import {
  ANALYTICS_TIME_RANGE_IDS,
  DEFAULT_ANALYTICS_TIME_RANGE_ID,
  type AnalyticsTimeRangeDefinition,
  type AnalyticsTimeRangeId,
} from '@/types/analytics-time-range';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEFINITIONS: Record<AnalyticsTimeRangeId, AnalyticsTimeRangeDefinition> = {
  '1d': {
    id: '1d',
    selectorLabel: '1D',
    pillLabel: 'Last 24 Hours',
    summaryPeriodPhrase: 'past 24 hours',
    chipPeriodPhrase: 'last 24 hours',
    durationMs: MS_PER_DAY,
  },
  '7d': {
    id: '7d',
    selectorLabel: '7D',
    pillLabel: 'Last 7 Days',
    summaryPeriodPhrase: 'past 7 days',
    chipPeriodPhrase: 'this week',
    durationMs: 7 * MS_PER_DAY,
  },
  '1m': {
    id: '1m',
    selectorLabel: '1M',
    pillLabel: 'Last 30 Days',
    summaryPeriodPhrase: 'past 30 days',
    chipPeriodPhrase: 'this month',
    durationMs: 30 * MS_PER_DAY,
  },
  '3m': {
    id: '3m',
    selectorLabel: '3M',
    pillLabel: 'Last 3 Months',
    summaryPeriodPhrase: 'past 3 months',
    chipPeriodPhrase: 'past 3 months',
    durationMs: 90 * MS_PER_DAY,
  },
  '6m': {
    id: '6m',
    selectorLabel: '6M',
    pillLabel: 'Last 6 Months',
    summaryPeriodPhrase: 'past 6 months',
    chipPeriodPhrase: 'past 6 months',
    durationMs: 180 * MS_PER_DAY,
  },
  '1y': {
    id: '1y',
    selectorLabel: '1Y',
    pillLabel: 'Last Year',
    summaryPeriodPhrase: 'past year',
    chipPeriodPhrase: 'past year',
    durationMs: 365 * MS_PER_DAY,
  },
};

export function isAnalyticsTimeRangeId(value: string): value is AnalyticsTimeRangeId {
  return (ANALYTICS_TIME_RANGE_IDS as readonly string[]).includes(value);
}

export function getAnalyticsTimeRangeDefinition(
  id: AnalyticsTimeRangeId = DEFAULT_ANALYTICS_TIME_RANGE_ID,
): AnalyticsTimeRangeDefinition {
  return DEFINITIONS[id];
}

export function getAnalyticsTimeRangeStartMs(
  id: AnalyticsTimeRangeId,
  nowMs: number = Date.now(),
): number {
  const { durationMs } = getAnalyticsTimeRangeDefinition(id);
  return nowMs - durationMs;
}

/** ISO timestamp for Supabase period_start (inclusive lower bound). */
export function getAnalyticsTimeRangePeriodStartIso(
  id: AnalyticsTimeRangeId,
  nowMs: number = Date.now(),
): string {
  return new Date(getAnalyticsTimeRangeStartMs(id, nowMs)).toISOString();
}

export function listAnalyticsTimeRangeDefinitions(): AnalyticsTimeRangeDefinition[] {
  return ANALYTICS_TIME_RANGE_IDS.map((id) => DEFINITIONS[id]);
}

export function countPostsCreatedSince(
  posts: { createdAt: string }[],
  rangeId: AnalyticsTimeRangeId,
  nowMs: number = Date.now(),
): number {
  const startMs = getAnalyticsTimeRangeStartMs(rangeId, nowMs);
  return posts.filter((post) => {
    const createdMs = new Date(post.createdAt).getTime();
    return Number.isFinite(createdMs) && createdMs >= startMs;
  }).length;
}
