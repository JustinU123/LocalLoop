import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentInsightsPanel } from '@/components/business/analytics/premium/content-insights-panel';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAnalyticsNavigation } from '@/contexts/analytics-navigation-context';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';
import { buildContentInsightsViewModel } from '@/utils/analytics-premium-view-model';

type PremiumContentPanelProps = {
  loading: boolean;
  postsFailed: boolean;
  posts: BusinessPost[];
  engagement: BusinessPostEngagementSummary | null;
  engagementFailed: boolean;
};

export function PremiumContentPanel({
  loading,
  postsFailed,
  posts,
  engagement,
  engagementFailed,
}: PremiumContentPanelProps) {
  const styles = useThemedStyles(createStyles);
  const { getFeatureAccess } = useAnalyticsAccess();
  const { goToIntelligence } = useAnalyticsNavigation();
  const access = getFeatureAccess('analytics.content_insights');
  const engagementAccess = getFeatureAccess('analytics.engagement_likes');
  const contentData = buildContentInsightsViewModel(postsFailed ? [] : posts, loading, {
    summary: engagement,
    failed: engagementFailed,
  });

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader
        title="Content"
        subtitle="What content is working and why — performance ranks when analytics are collected."
      />
      <ContentInsightsPanel
        access={access}
        engagementAccess={engagementAccess}
        data={contentData}
        performanceTrackingAvailable={false}
      />

      <Pressable
        onPress={() => goToIntelligence('content_opportunities')}
        style={({ pressed }) => [styles.intelligenceCta, pressed && styles.intelligenceCtaPressed]}
        accessibilityRole="button"
        accessibilityLabel="Explore Content Opportunities">
        <Text style={styles.intelligenceCtaText}>Explore Content Opportunities</Text>
        <Ionicons name="arrow-forward" size={16} color={styles.intelligenceCtaText.color} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 16,
    },
    intelligenceCta: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: BrandRadius.pill,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
    },
    intelligenceCtaPressed: {
      opacity: 0.92,
    },
    intelligenceCtaText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
