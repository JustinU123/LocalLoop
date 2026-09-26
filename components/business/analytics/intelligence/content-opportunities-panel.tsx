import { type RefObject } from 'react';
import { View } from 'react-native';

import { ContentOpportunityCard } from '@/components/business/analytics/intelligence/content-opportunity-card';
import { IntelligenceSparkleTitle } from '@/components/business/analytics/intelligence/intelligence-sparkle-title';
import type { AnalyticsFeatureAccess } from '@/types/analytics-access';
import type { ContentOpportunitiesData } from '@/types/analytics-intelligence-data';

export type ContentOpportunitiesPanelProps = {
  access: AnalyticsFeatureAccess;
  data: ContentOpportunitiesData;
  sectionRef?: RefObject<View | null>;
};

export function ContentOpportunitiesPanel({
  access,
  data,
  sectionRef,
}: ContentOpportunitiesPanelProps) {
  return (
    <View ref={sectionRef} collapsable={false} style={{ gap: 12 }}>
      <IntelligenceSparkleTitle
        title="Content Opportunities"
        subtitle="Underserved topics and timing gaps — prioritized for differentiation, not copy-paste trends."
      />
      {data.opportunities.map((opportunity) => (
        <ContentOpportunityCard key={opportunity.id} access={access} opportunity={opportunity} />
      ))}
    </View>
  );
}
