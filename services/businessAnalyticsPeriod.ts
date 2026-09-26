import { getBusinessFollowerGrowthForOwnerPeriod } from '@/services/businessFollowerAnalyticsPeriod';
import { getBusinessPostEngagementForOwnerPeriod } from '@/services/postEngagementAnalyticsPeriod';
import type { BusinessAnalyticsPeriodMetrics } from '@/types/analytics-period-data';
import { mergeBusinessAnalyticsPeriodMetrics } from '@/utils/map-analytics-period-metrics';

export type BusinessAnalyticsPeriodResult =
  | { ok: true; metrics: BusinessAnalyticsPeriodMetrics }
  | {
      ok: false;
      code: 'network' | 'forbidden' | 'invalid_period' | 'partial' | 'unexpected';
      message: string;
    };

/**
 * Fetches combined owner period metrics. Does not compute period_start — pass ISO from
 * getAnalyticsTimeRangePeriodStartIso or another canonical source.
 */
export async function getBusinessAnalyticsPeriodMetrics(
  businessId: string,
  periodStart: string | Date,
): Promise<BusinessAnalyticsPeriodResult> {
  const [engagementResult, followersResult] = await Promise.all([
    getBusinessPostEngagementForOwnerPeriod(businessId, periodStart),
    getBusinessFollowerGrowthForOwnerPeriod(businessId, periodStart),
  ]);

  if (!engagementResult.ok && !followersResult.ok) {
    if (engagementResult.code === 'forbidden' || followersResult.code === 'forbidden') {
      return {
        ok: false,
        code: 'forbidden',
        message: 'Period analytics are not available for this business.',
      };
    }
    if (engagementResult.code === 'invalid_period' || followersResult.code === 'invalid_period') {
      return {
        ok: false,
        code: 'invalid_period',
        message: 'Invalid analytics period start.',
      };
    }
    return {
      ok: false,
      code: engagementResult.code === 'network' || followersResult.code === 'network' ? 'network' : 'unexpected',
      message: 'Unable to load period analytics.',
    };
  }

  if (!engagementResult.ok || !followersResult.ok) {
    return {
      ok: false,
      code: 'partial',
      message: 'Only part of period analytics could be loaded.',
    };
  }

  return {
    ok: true,
    metrics: mergeBusinessAnalyticsPeriodMetrics(engagementResult.metrics, followersResult.metrics),
  };
}
