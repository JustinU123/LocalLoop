import type { AnalyticsMetricState } from '@/types/analytics-access';

export function engagementCountMetric(params: {
  loading: boolean;
  failed: boolean;
  value: number | null;
}): AnalyticsMetricState {
  const { loading, failed, value } = params;
  if (failed) {
    return { state: 'unavailable' };
  }
  if (loading) {
    return { state: 'loading' };
  }
  if (value === null) {
    return { state: 'unavailable' };
  }
  return { state: 'ready', value };
}
