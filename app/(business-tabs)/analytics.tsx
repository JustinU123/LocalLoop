import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyticsAudiencePanel } from '@/components/business/analytics/analytics-audience-panel';
import { AnalyticsCompetitiveIntelligencePanel } from '@/components/business/analytics/analytics-competitive-intelligence-panel';
import { AnalyticsContentPanel } from '@/components/business/analytics/analytics-content-panel';
import { AnalyticsMorePanel } from '@/components/business/analytics/analytics-more-panel';
import { AnalyticsOverviewPanel } from '@/components/business/analytics/analytics-overview-panel';
import { AnalyticsSegmentControl } from '@/components/business/analytics/analytics-segment-control';
import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import {
  AnalyticsNavigationProvider,
  useAnalyticsNavigation,
} from '@/contexts/analytics-navigation-context';
import { AnalyticsTimeRangeProvider } from '@/contexts/analytics-time-range-context';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useBasicAnalyticsData } from '@/hooks/use-basic-analytics-data';
import { useThemedStyles } from '@/hooks/use-themed-styles';
function BusinessAnalyticsScreenContent() {
  const styles = useThemedStyles(createStyles);
  const { businessApplication, businessRecord } = useAccountMode();
  const { activeSegment, setActiveSegment } = useAnalyticsNavigation();

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';
  const businessId = businessRecord?.id;

  const {
    loadState,
    totalFollowers,
    followersFailed,
    posts,
    postsFailed,
    engagement,
    engagementFailed,
    refresh,
  } = useBasicAnalyticsData(businessId);
  const [summaryReplayEpoch, setSummaryReplayEpoch] = useState(0);
  const [summaryPlayedKey, setSummaryPlayedKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setSummaryPlayedKey(null);
      setSummaryReplayEpoch((epoch) => epoch + 1);
      void refresh();
    }, [refresh]),
  );

  const loading = loadState === 'loading' || loadState === 'idle';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LocalLoopWordmark style={styles.wordmark} />
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>{businessName}</Text>

        <AnalyticsSegmentControl activeSegment={activeSegment} onSelect={setActiveSegment} />

        <View style={styles.segmentPanel}>
          {activeSegment === 'overview' ? (
            <AnalyticsOverviewPanel
              loading={loading}
              totalFollowers={totalFollowers}
              followersFailed={followersFailed}
              posts={posts}
              postsFailed={postsFailed}
              engagement={engagement}
              engagementFailed={engagementFailed}
              summaryReplayEpoch={summaryReplayEpoch}
              summaryPlayedKey={summaryPlayedKey}
              onSummaryPlayed={setSummaryPlayedKey}
            />
          ) : null}
          {activeSegment === 'content' ? (
            <AnalyticsContentPanel
              loading={loading}
              posts={posts}
              postsFailed={postsFailed}
              engagement={engagement}
              engagementFailed={engagementFailed}
            />
          ) : null}
          {activeSegment === 'audience' ? (
            <AnalyticsAudiencePanel
              loading={loading}
              totalFollowers={totalFollowers}
              followersFailed={followersFailed}
            />
          ) : null}
          {activeSegment === 'intelligence' ? (
            <AnalyticsCompetitiveIntelligencePanel loading={loading} />
          ) : null}
          {activeSegment === 'more' ? <AnalyticsMorePanel /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function BusinessAnalyticsScreen() {
  return (
    <AnalyticsNavigationProvider>
      <AnalyticsTimeRangeProvider>
        <BusinessAnalyticsScreenContent />
      </AnalyticsTimeRangeProvider>
    </AnalyticsNavigationProvider>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 120,
      gap: 14,
    },
    wordmark: {
      marginTop: 4,
    },
    title: {
      color: theme.text,
      fontSize: 34,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    segmentPanel: {
      marginTop: 4,
    },
  });
}
