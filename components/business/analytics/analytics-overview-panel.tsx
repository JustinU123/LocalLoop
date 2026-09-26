import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AnalyticsFeatureShell } from '@/components/business/analytics/analytics-feature-shell';
import { AdvancedInsightsPanel } from '@/components/business/analytics/premium/advanced-insights-panel';
import { ProOverviewPanel } from '@/components/business/analytics/pro/pro-overview-panel';
import { PremiumOverviewPanel } from '@/components/business/analytics/premium/premium-overview-panel';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { usesPremiumAnalyticsPanels, usesProAnalyticsPanels } from '@/utils/analytics-panel-routing';
import { getAdvancedInsightsViewModel } from '@/utils/analytics-premium-view-model';
import { AnalyticsMetricCard } from '@/components/business/analytics/analytics-metric-card';
import { AnalyticsProfileActivityShell } from '@/components/business/analytics/analytics-profile-activity-shell';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { AnalyticsTimeRangeControl } from '@/components/business/analytics/analytics-time-range-control';
import { BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { BASIC_OVERVIEW_METRICS } from '@/types/analytics-basic';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';

type AnalyticsOverviewPanelProps = {
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

function basicOverviewMetricValue(
  metricId: (typeof BASIC_OVERVIEW_METRICS)[number]['id'],
  loading: boolean,
  engagement: BusinessPostEngagementSummary | null,
  engagementFailed: boolean,
): string {
  if (metricId === 'likes') {
    if (engagementFailed) {
      return '—';
    }
    if (loading) {
      return '…';
    }
    return String(engagement?.totalLikes ?? 0);
  }
  if (metricId === 'comments') {
    if (engagementFailed) {
      return '—';
    }
    if (loading) {
      return '…';
    }
    return String(engagement?.totalComments ?? 0);
  }
  return '—';
}

export function AnalyticsOverviewPanel({
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
}: AnalyticsOverviewPanelProps) {
  const styles = useThemedStyles(createStyles);
  const { getFeatureAccess, hasCapability } = useAnalyticsAccess();
  const advancedAccess = getFeatureAccess('analytics.advanced_insights');
  const engagementAccess = getFeatureAccess('analytics.engagement_likes');
  const advancedData = getAdvancedInsightsViewModel(loading, {
    summary: engagement,
    failed: engagementFailed,
  });

  if (usesPremiumAnalyticsPanels(hasCapability)) {
    return (
      <PremiumOverviewPanel
        loading={loading}
        totalFollowers={totalFollowers}
        followersFailed={followersFailed}
        posts={posts}
        postsFailed={postsFailed}
        engagement={engagement}
        engagementFailed={engagementFailed}
        summaryReplayEpoch={summaryReplayEpoch}
        summaryPlayedKey={summaryPlayedKey}
        onSummaryPlayed={onSummaryPlayed}
      />
    );
  }

  if (usesProAnalyticsPanels(hasCapability)) {
    return (
      <ProOverviewPanel
        loading={loading}
        totalFollowers={totalFollowers}
        followersFailed={followersFailed}
        posts={posts}
        postsFailed={postsFailed}
        engagement={engagement}
        engagementFailed={engagementFailed}
      />
    );
  }

  return (
    <View style={styles.root}>
      <AnalyticsTimeRangeControl />

      <AnalyticsSectionHeader
        title="Performance"
        subtitle="Metrics appear as LocalLoop collects activity for your business."
      />

      <View style={styles.metricGrid}>
        {BASIC_OVERVIEW_METRICS.map((metric) => {
          const isEngagementMetric = metric.id === 'likes' || metric.id === 'comments';
          const availability =
            isEngagementMetric && engagementFailed ? 'unavailable' : metric.availability;
          return (
            <AnalyticsMetricCard
              key={metric.id}
              label={metric.label}
              icon={metric.icon}
              iconTone={metric.iconTone}
              value={basicOverviewMetricValue(metric.id, loading, engagement, engagementFailed)}
              availability={availability}
              unavailableHint={metric.unavailableHint}
              loading={loading && !isEngagementMetric}
            />
          );
        })}
      </View>

      <AnalyticsSectionHeader title="Profile activity" />
      <View style={styles.graphCard}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={styles.loader.color} />
          </View>
        ) : (
          <AnalyticsProfileActivityShell />
        )}
      </View>

      <AnalyticsFeatureShell
        access={advancedAccess}
        title="Advanced Insights"
        description="See impressions, click-through rate, and deeper performance trends."
        upgradeSource="analytics-overview-advanced"
        lockedViewportHeight={300}>
        <AdvancedInsightsPanel
          access={advancedAccess}
          engagementAccess={engagementAccess}
          data={advancedData}
        />
      </AnalyticsFeatureShell>
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
