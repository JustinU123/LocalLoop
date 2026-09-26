import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AnalyticsProfileActivityShell } from '@/components/business/analytics/analytics-profile-activity-shell';
import { PremiumMetricTile } from '@/components/business/analytics/premium/premium-metric-tile';
import { PremiumMetricValue } from '@/components/business/analytics/premium/premium-metric-value';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsFeatureAccess } from '@/types/analytics-access';
import type { AdvancedInsightsData } from '@/types/analytics-premium-data';

type AdvancedInsightsPanelProps = {
  access: AnalyticsFeatureAccess;
  engagementAccess: AnalyticsFeatureAccess;
  data: AdvancedInsightsData;
};

export function AdvancedInsightsPanel({ access, engagementAccess, data }: AdvancedInsightsPanelProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader
        title="Performance summary"
        subtitle="Deeper performance once view and engagement events are collected."
      />
      <View style={styles.metricGrid}>
        <PremiumMetricTile
          access={access}
          label="Profile views"
          icon="eye-outline"
          tone="emerald"
          metric={data.profileViews}
        />
        <PremiumMetricTile
          access={access}
          label="Impressions"
          icon="images-outline"
          tone="coral"
          metric={data.impressions}
        />
        <PremiumMetricTile
          access={access}
          label="Saves"
          icon="bookmark-outline"
          tone="amber"
          metric={data.saves}
        />
        <PremiumMetricTile
          access={access}
          label="Engagement rate"
          icon="stats-chart-outline"
          tone="teal"
          metric={data.engagementRate}
        />
        <PremiumMetricTile
          access={engagementAccess}
          label="Likes"
          icon="heart-outline"
          tone="coral"
          metric={data.likes}
        />
        <PremiumMetricTile
          access={engagementAccess}
          label="Comments"
          icon="chatbubble-outline"
          tone="blue"
          metric={data.comments}
        />
      </View>

      <AnalyticsSectionHeader title="Performance over time" />
      <View style={styles.chartCard}>
        {data.performanceOverTime === 'loading' ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={styles.loader.color} />
          </View>
        ) : (
          <AnalyticsProfileActivityShell />
        )}
      </View>

      <AnalyticsSectionHeader title="Engagement funnel" />
      <View style={styles.funnelCard}>
        <FunnelStep access={access} label="Impressions" metric={data.funnel.impressions} />
        <Text style={styles.funnelArrow}>↓</Text>
        <FunnelStep access={access} label="Profile visits" metric={data.funnel.profileVisits} />
        <Text style={styles.funnelArrow}>↓</Text>
        <FunnelStep
          access={access}
          label="Saves / follows"
          metric={data.funnel.savesAndFollows}
        />
      </View>

      <View style={styles.followersRow}>
        <Text style={styles.followersLabel}>Followers gained (period)</Text>
        <PremiumMetricValue access={access} metric={data.followersGained} />
      </View>
    </View>
  );
}

function FunnelStep({
  access,
  label,
  metric,
}: {
  access: AnalyticsFeatureAccess;
  label: string;
  metric: AdvancedInsightsData['funnel']['impressions'];
}) {
  const styles = useThemedStyles(createFunnelStyles);

  return (
    <View style={styles.step}>
      <Text style={styles.label}>{label}</Text>
      <PremiumMetricValue access={access} metric={metric} />
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 14,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chartCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      overflow: 'hidden',
    },
    loadingWrap: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    loader: {
      color: theme.emerald,
    },
    funnelCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 6,
      alignItems: 'center',
    },
    funnelArrow: {
      color: theme.textMuted,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    followersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
    },
    followersLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      flex: 1,
      paddingRight: 12,
    },
  });
}

function createFunnelStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    step: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    label: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
