import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ProPerformanceCoach } from '@/components/business/analytics/pro/pro-performance-coach';
import { ProPerformanceOverTimeShell } from '@/components/business/analytics/pro/pro-performance-over-time-shell';
import { AnalyticsMetricCard } from '@/components/business/analytics/analytics-metric-card';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { AnalyticsTimeRangeControl } from '@/components/business/analytics/analytics-time-range-control';
import { BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAnalyticsTimeRange } from '@/contexts/analytics-time-range-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { PRO_PERFORMANCE_SUMMARY_METRICS } from '@/types/analytics-pro-performance';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';
import { proPerformanceSummaryMetricValue } from '@/utils/analytics-pro-view-model';
import { buildProPerformanceCoach } from '@/utils/build-pro-performance-coach';

type ProOverviewPanelProps = {
  loading: boolean;
  totalFollowers: number | null;
  followersFailed: boolean;
  posts: BusinessPost[];
  postsFailed: boolean;
  engagement: BusinessPostEngagementSummary | null;
  engagementFailed: boolean;
};

export function ProOverviewPanel({
  loading,
  totalFollowers,
  followersFailed,
  posts,
  postsFailed,
  engagement,
  engagementFailed,
}: ProOverviewPanelProps) {
  const styles = useThemedStyles(createStyles);
  const { selectedRangeId } = useAnalyticsTimeRange();

  const coach = useMemo(
    () =>
      buildProPerformanceCoach({
        selectedRangeId,
        loading,
        posts,
        postsFailed,
        engagement,
        engagementFailed,
        totalFollowers,
        followersFailed,
      }),
    [
      selectedRangeId,
      loading,
      posts,
      postsFailed,
      engagement,
      engagementFailed,
      totalFollowers,
      followersFailed,
    ],
  );

  return (
    <View style={styles.root}>
      <AnalyticsTimeRangeControl />

      <ProPerformanceCoach coach={coach} />

      <AnalyticsSectionHeader
        title="Performance summary"
        subtitle="First-party performance for your business. Lifetime likes and comments; other metrics when tracking is live."
      />

      <View style={styles.metricGrid}>
        {PRO_PERFORMANCE_SUMMARY_METRICS.map((metric) => {
          const isEngagementMetric = metric.id === 'likes' || metric.id === 'comments';
          const availability =
            isEngagementMetric && engagementFailed ? 'unavailable' : metric.availability;
          let value = '—';
          if (metric.id === 'likes' || metric.id === 'comments') {
            value = proPerformanceSummaryMetricValue(
              metric.id,
              loading,
              engagement,
              engagementFailed,
            );
          }

          return (
            <AnalyticsMetricCard
              key={metric.id}
              label={metric.label}
              icon={metric.icon}
              iconTone={metric.iconTone}
              value={value}
              availability={availability}
              unavailableHint={metric.unavailableHint}
              loading={loading && !isEngagementMetric}
            />
          );
        })}
      </View>

      <AnalyticsSectionHeader
        title="Performance over time"
        subtitle="Historical trends for the selected range when event tracking is enabled."
      />
      <View style={styles.graphCard}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={styles.loader.color} />
          </View>
        ) : (
          <ProPerformanceOverTimeShell selectedRangeId={selectedRangeId} />
        )}
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 16,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    graphCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    loadingWrap: {
      paddingVertical: 48,
      alignItems: 'center',
    },
    loader: {
      color: theme.emerald,
    },
  });
}
