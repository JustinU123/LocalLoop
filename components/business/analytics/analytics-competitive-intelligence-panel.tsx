import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnalyticsFeatureShell } from '@/components/business/analytics/analytics-feature-shell';
import { ContentOpportunitiesPanel } from '@/components/business/analytics/intelligence/content-opportunities-panel';
import { IntelligenceSparkleTitle } from '@/components/business/analytics/intelligence/intelligence-sparkle-title';
import { LocalMarketIntelligencePanel } from '@/components/business/analytics/intelligence/local-market-intelligence-panel';
import { PotentialReachPanel } from '@/components/business/analytics/intelligence/potential-reach-panel';
import { useAnalyticsNavigation } from '@/contexts/analytics-navigation-context';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AppThemeTokens } from '@/constants/business-theme';
import {
  getContentOpportunitiesViewModel,
  getLocalMarketViewModel,
  getPotentialReachViewModel,
} from '@/utils/analytics-intelligence-view-model';
type AnalyticsCompetitiveIntelligencePanelProps = {
  loading: boolean;
};

function CompetitiveIntelligenceBody({
  loading,
  showScreenHeader = true,
}: AnalyticsCompetitiveIntelligencePanelProps & { showScreenHeader?: boolean }) {
  const styles = useThemedStyles(createStyles);
  const { getFeatureAccess } = useAnalyticsAccess();
  const access = getFeatureAccess('analytics.competitive_intelligence');
  const { consumeIntelligenceFocus } = useAnalyticsNavigation();
  const opportunitiesRef = useRef<View>(null);

  useEffect(() => {
    const focus = consumeIntelligenceFocus();
    if (focus === 'content_opportunities') {
      // Parent ScrollView section scroll-to-focus can be wired in a follow-up.
    }
  }, [consumeIntelligenceFocus]);

  const reachData = getPotentialReachViewModel(loading);
  const opportunitiesData = getContentOpportunitiesViewModel(loading);
  const localMarketData = getLocalMarketViewModel(loading);

  return (
    <View style={styles.scrollContent}>
      {showScreenHeader ? (
        <IntelligenceSparkleTitle
          title="Competitive Intelligence"
          subtitle="Understand your local opportunity and discover what to do next — learn from the market, not spy on competitors."
          size="large"
        />
      ) : null}

      <PotentialReachPanel access={access} data={reachData} />
      <ContentOpportunitiesPanel
        access={access}
        data={opportunitiesData}
        sectionRef={opportunitiesRef}
      />
      <LocalMarketIntelligencePanel access={access} data={localMarketData} />
    </View>
  );
}

export function AnalyticsCompetitiveIntelligencePanel({
  loading,
}: AnalyticsCompetitiveIntelligencePanelProps) {
  const { getFeatureAccess } = useAnalyticsAccess();
  const access = getFeatureAccess('analytics.competitive_intelligence');

  if (access === 'unlocked') {
    return <CompetitiveIntelligenceBody loading={loading} />;
  }

  return (
    <AnalyticsFeatureShell
      access="locked"
      title="Competitive Intelligence"
      description="Understand your local opportunity and discover differentiated content strategies."
      upgradeSource="analytics-competitive-intelligence"
      lockedViewportHeight={340}
      lockedVeilVariant="intelligence">
      <CompetitiveIntelligenceBody loading={loading} showScreenHeader={false} />
    </AnalyticsFeatureShell>
  );
}

function createStyles(_theme: AppThemeTokens) {
  return StyleSheet.create({
    scrollContent: {
      gap: 20,
      paddingBottom: 8,
      width: '100%',
      minWidth: 0,
      alignSelf: 'stretch',
    },
  });
}
