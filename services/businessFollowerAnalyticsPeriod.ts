import { supabase } from '@/lib/supabase';

import type { BusinessAnalyticsPeriodMetrics } from '@/types/analytics-period-data';
import { mapFollowerGrowthPeriodPayload } from '@/utils/map-analytics-period-metrics';
import { normalizeAnalyticsPeriodStart } from '@/utils/normalize-analytics-period-start';

export type BusinessFollowerGrowthPeriodResult =
  | {
      ok: true;
      metrics: Pick<BusinessAnalyticsPeriodMetrics, 'followersGained'>;
    }
  | { ok: false; code: 'network' | 'forbidden' | 'invalid_period' | 'unexpected'; message: string };

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  return /network request failed|failed to fetch|network error/i.test(message);
}

export async function getBusinessFollowerGrowthForOwnerPeriod(
  businessId: string,
  periodStart: string | Date,
): Promise<BusinessFollowerGrowthPeriodResult> {
  const trimmedId = businessId.trim();
  const periodStartIso = normalizeAnalyticsPeriodStart(periodStart);

  if (!trimmedId) {
    return {
      ok: true,
      metrics: { followersGained: 0 },
    };
  }

  if (!periodStartIso) {
    return {
      ok: false,
      code: 'invalid_period',
      message: 'Invalid analytics period start.',
    };
  }

  try {
    const { data, error } = await supabase.rpc('get_business_follower_growth_for_owner_period', {
      target_business_id: trimmedId,
      period_start: periodStartIso,
    });

    if (error) {
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load follower growth analytics.',
      };
    }

    if (data === null) {
      return {
        ok: false,
        code: 'forbidden',
        message: 'Follower growth analytics are not available for this business.',
      };
    }

    const payload = data as { followers_gained: number | string };

    return {
      ok: true,
      metrics: mapFollowerGrowthPeriodPayload(payload),
    };
  } catch (error) {
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load follower growth analytics.',
    };
  }
}
