import { useCallback, useRef, useState } from 'react';

import { getBusinessFollowerGrowthForOwnerPeriod } from '@/services/businessFollowerAnalyticsPeriod';
import { getBusinessPostEngagementForOwnerPeriod } from '@/services/postEngagementAnalyticsPeriod';
import type {
  WeeklySnapshotEngagementPeriodInput,
  WeeklySnapshotFollowersPeriodInput,
} from '@/utils/build-weekly-snapshot';
import { getAnalyticsTimeRangePeriodStartIso } from '@/utils/analytics-time-range';

type UseWeeklySnapshotPeriodMetricsResult = {
  engagementPeriod: WeeklySnapshotEngagementPeriodInput;
  followersPeriod: WeeklySnapshotFollowersPeriodInput;
  refreshPeriodMetrics: () => Promise<void>;
};

export function useWeeklySnapshotPeriodMetrics(
  businessId: string | undefined,
  enabled: boolean,
): UseWeeklySnapshotPeriodMetricsResult {
  const businessIdKey = businessId?.trim() ?? '';
  const loadGenerationRef = useRef(0);

  const [engagementPeriod, setEngagementPeriod] = useState<WeeklySnapshotEngagementPeriodInput>({
    status: 'idle',
  });
  const [followersPeriod, setFollowersPeriod] = useState<WeeklySnapshotFollowersPeriodInput>({
    status: 'idle',
  });

  const refreshPeriodMetrics = useCallback(async () => {
    if (!enabled || !businessIdKey) {
      loadGenerationRef.current += 1;
      setEngagementPeriod({ status: 'idle' });
      setFollowersPeriod({ status: 'idle' });
      return;
    }

    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    setEngagementPeriod((prev) =>
      prev.status === 'ready' ? prev : { status: 'loading' },
    );
    setFollowersPeriod((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));

    const periodStart = getAnalyticsTimeRangePeriodStartIso('7d');

    const [engagementResult, followersResult] = await Promise.all([
      getBusinessPostEngagementForOwnerPeriod(businessIdKey, periodStart),
      getBusinessFollowerGrowthForOwnerPeriod(businessIdKey, periodStart),
    ]);

    if (loadGenerationRef.current !== generation) {
      return;
    }

    if (engagementResult.ok) {
      setEngagementPeriod({
        status: 'ready',
        likesReceived: engagementResult.metrics.likesReceived,
        commentsReceived: engagementResult.metrics.commentsReceived,
      });
    } else {
      setEngagementPeriod({ status: 'unavailable' });
    }

    if (followersResult.ok) {
      setFollowersPeriod({
        status: 'ready',
        followersGained: followersResult.metrics.followersGained,
      });
    } else {
      setFollowersPeriod({ status: 'unavailable' });
    }
  }, [businessIdKey, enabled]);

  return {
    engagementPeriod,
    followersPeriod,
    refreshPeriodMetrics,
  };
}
