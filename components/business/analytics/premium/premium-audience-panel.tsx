import { StyleSheet, Text, View } from 'react-native';

import { AudienceInsightsPanel } from '@/components/business/analytics/premium/audience-insights-panel';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { buildAudienceInsightsViewModel } from '@/utils/analytics-premium-view-model';

type PremiumAudiencePanelProps = {
  loading: boolean;
  totalFollowers: number | null;
  followersFailed: boolean;
};

export function PremiumAudiencePanel({
  loading,
  totalFollowers,
  followersFailed,
}: PremiumAudiencePanelProps) {
  const styles = useThemedStyles(createStyles);
  const { getFeatureAccess } = useAnalyticsAccess();
  const access = getFeatureAccess('analytics.audience_insights');
  const audienceData = buildAudienceInsightsViewModel({
    totalFollowers,
    loading,
    followersFailed,
  });

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader
        title="Audience"
        subtitle="How your audience engages — patterns only, never sensitive demographics."
      />
      <Text style={styles.privacy}>
        LocalLoop does not collect age, gender, ethnicity, income, or exact personal location for
        analytics. Follower identities stay private.
      </Text>
      <AudienceInsightsPanel access={access} data={audienceData} />
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 14,
    },
    privacy: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
      paddingHorizontal: 4,
    },
  });
}
