import { StyleSheet, Text, View } from 'react-native';

import { AnalyticsFeatureShell } from '@/components/business/analytics/analytics-feature-shell';
import { AudienceInsightsPanel } from '@/components/business/analytics/premium/audience-insights-panel';
import { ProAudiencePanel } from '@/components/business/analytics/pro/pro-audience-panel';
import { PremiumAudiencePanel } from '@/components/business/analytics/premium/premium-audience-panel';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { usesPremiumAnalyticsPanels, usesProAnalyticsPanels } from '@/utils/analytics-panel-routing';
import { buildAudienceInsightsViewModel } from '@/utils/analytics-premium-view-model';
import { AnalyticsMetricCard } from '@/components/business/analytics/analytics-metric-card';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type AnalyticsAudiencePanelProps = {
  loading: boolean;
  totalFollowers: number | null;
  followersFailed: boolean;
};

export function AnalyticsAudiencePanel({
  loading,
  totalFollowers,
  followersFailed,
}: AnalyticsAudiencePanelProps) {
  const styles = useThemedStyles(createStyles);
  const { getFeatureAccess, hasCapability } = useAnalyticsAccess();
  const audienceAccess = getFeatureAccess('analytics.audience_insights');
  const audienceData = buildAudienceInsightsViewModel({
    totalFollowers,
    loading,
    followersFailed,
  });

  if (usesPremiumAnalyticsPanels(hasCapability)) {
    return (
      <PremiumAudiencePanel
        loading={loading}
        totalFollowers={totalFollowers}
        followersFailed={followersFailed}
      />
    );
  }

  if (usesProAnalyticsPanels(hasCapability)) {
    return (
      <ProAudiencePanel
        loading={loading}
        totalFollowers={totalFollowers}
        followersFailed={followersFailed}
      />
    );
  }

  const followerValue = followersFailed ? '—' : loading ? '…' : String(totalFollowers ?? 0);

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader
        title="Audience"
        subtitle="Only metrics LocalLoop currently stores for your business."
      />

      <AnalyticsMetricCard
        label="Total followers"
        icon="people-outline"
        iconTone="emerald"
        value={followerValue}
        availability="ready"
        loading={loading && !followersFailed}
        variant="hero"
      />

      {followersFailed ? (
        <Text style={styles.errorText}>Follower count could not be loaded right now.</Text>
      ) : (
        <Text style={styles.footnote}>
          LocalLoop does not collect age, gender, income, or other demographic data. Follower
          identities are not exposed to businesses.
        </Text>
      )}

      <AnalyticsFeatureShell
        access={audienceAccess}
        title="Audience Insights"
        description="Understand who engages with your business and how your local audience behaves."
        upgradeSource="analytics-audience-insights"
        lockedViewportHeight={300}>
        <AudienceInsightsPanel access={audienceAccess} data={audienceData} />
      </AnalyticsFeatureShell>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 16,
    },
    footnote: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
      paddingHorizontal: 4,
    },
    errorText: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      paddingHorizontal: 4,
    },
  });
}
