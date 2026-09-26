import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ObscuredBlock } from '@/components/business/analytics/analytics-premium-obscured';
import { PremiumMetricTile } from '@/components/business/analytics/premium/premium-metric-tile';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsFeatureAccess } from '@/types/analytics-access';
import type { AudienceInsightsData } from '@/types/analytics-premium-data';

type AudienceInsightsPanelProps = {
  access: AnalyticsFeatureAccess;
  data: AudienceInsightsData;
};

export function AudienceInsightsPanel({ access, data }: AudienceInsightsPanelProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader
        title="Follower growth"
        subtitle="Trends appear when follow events can be aggregated for your business."
      />
      <View style={styles.metricGrid}>
        <PremiumMetricTile
          access={access}
          label="Total followers"
          icon="people-outline"
          tone="emerald"
          metric={data.totalFollowers}
        />
        <PremiumMetricTile
          access={access}
          label="Growth (period)"
          icon="trending-up-outline"
          tone="coral"
          metric={data.followerGrowth}
        />
      </View>

      <AnalyticsSectionHeader
        title="Engagement mix"
        subtitle="Returning vs new engagement — no individual follower identities."
      />
      <View style={styles.metricGrid}>
        <PremiumMetricTile
          access={access}
          label="Returning engagement"
          icon="refresh-outline"
          tone="teal"
          metric={data.returningEngagement}
        />
        <PremiumMetricTile
          access={access}
          label="New engagement"
          icon="person-add-outline"
          tone="amber"
          metric={data.newEngagement}
        />
      </View>

      <AnalyticsSectionHeader title="When your audience engages" />
      <View style={styles.chartCard}>
        {access === 'locked' ? (
          <View style={styles.lockedChart}>
            <ObscuredBlock width="100%" height={120} />
          </View>
        ) : data.engagementByTime === 'loading' ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={styles.loader.color} />
          </View>
        ) : (
          <Text style={styles.unavailableCopy}>
            Day and time breakdowns will appear when engagement timestamps are available.
          </Text>
        )}
      </View>

      <View style={styles.localCard}>
        <Text style={styles.localTitle}>Local audience activity</Text>
        <Text style={styles.localCopy}>
          Approximate local reach from legitimate in-app signals — never age, gender, or income.
        </Text>
        {access === 'locked' ? (
          <ObscuredBlock width="100%" height={56} />
        ) : data.localActivity === 'loading' ? (
          <ActivityIndicator size="small" color={styles.loader.color} />
        ) : (
          <Text style={styles.unavailable}>—</Text>
        )}
      </View>
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
      padding: 14,
      minHeight: 100,
      justifyContent: 'center',
    },
    lockedChart: {
      paddingVertical: 8,
    },
    loadingWrap: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    loader: {
      color: theme.emerald,
    },
    unavailableCopy: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    localCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 8,
    },
    localTitle: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    localCopy: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    unavailable: {
      color: theme.textSecondary,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
    },
  });
}
