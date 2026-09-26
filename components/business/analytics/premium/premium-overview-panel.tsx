import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PremiumBusinessSummary } from '@/components/business/analytics/intelligence/premium-business-summary';
import { AdvancedInsightsPanel } from '@/components/business/analytics/premium/advanced-insights-panel';
import { AnalyticsTimeRangeControl } from '@/components/business/analytics/analytics-time-range-control';
import { useAnalyticsTimeRange } from '@/contexts/analytics-time-range-context';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { buildPremiumBusinessSummary } from '@/utils/build-premium-business-summary';
import { getAdvancedInsightsViewModel } from '@/utils/analytics-premium-view-model';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';

type PremiumOverviewPanelProps = {
  loading: boolean;
  totalFollowers: number | null;
  followersFailed: boolean;
  posts: BusinessPost[];
  postsFailed: boolean;
  engagement: BusinessPostEngagementSummary | null;
  engagementFailed: boolean;
  summaryReplayEpoch: number;
  summaryPlayedKey: string | null;
  onSummaryPlayed: (contentKey: string) => void;
};

export function PremiumOverviewPanel({
  loading,
  totalFollowers,
  followersFailed,
  posts,
  postsFailed,
  engagement,
  engagementFailed,
  summaryReplayEpoch,
  summaryPlayedKey,
  onSummaryPlayed,
}: PremiumOverviewPanelProps) {
  const { selectedRangeId } = useAnalyticsTimeRange();
  const { getFeatureAccess } = useAnalyticsAccess();
  const access = getFeatureAccess('analytics.advanced_insights');
  const engagementAccess = getFeatureAccess('analytics.engagement_likes');
  const advancedData = getAdvancedInsightsViewModel(loading, {
    summary: engagement,
    failed: engagementFailed,
  });

  const summary = useMemo(
    () =>
      buildPremiumBusinessSummary({
        selectedPeriod: selectedRangeId,
        loading,
        totalFollowers,
        followersFailed,
        followersGainedInPeriod: null,
        posts,
        postsFailed,
        totalLikes: engagement?.totalLikes ?? 0,
        totalComments: engagement?.totalComments ?? 0,
        engagementFailed,
      }),
    [
      selectedRangeId,
      loading,
      totalFollowers,
      followersFailed,
      posts,
      postsFailed,
      engagement,
      engagementFailed,
    ],
  );

  return (
    <View style={styles.root}>
      <AnalyticsTimeRangeControl />
      <PremiumBusinessSummary
        summary={summary}
        replayEpoch={summaryReplayEpoch}
        summaryPlayedKey={summaryPlayedKey}
        onSummaryPlayed={onSummaryPlayed}
      />
      <AdvancedInsightsPanel access={access} engagementAccess={engagementAccess} data={advancedData} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
});
