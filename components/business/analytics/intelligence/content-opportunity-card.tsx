import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PremiumMetricValue } from '@/components/business/analytics/premium/premium-metric-value';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsFeatureAccess } from '@/types/analytics-access';
import type { ContentOpportunityCardData } from '@/types/analytics-intelligence-data';
import { getIntelligenceTheme } from '@/utils/analytics-intelligence-theme';

type ContentOpportunityCardProps = {
  access: AnalyticsFeatureAccess;
  opportunity: ContentOpportunityCardData;
  onStartCreating?: () => void;
};

export function ContentOpportunityCard({
  access,
  opportunity,
  onStartCreating,
}: ContentOpportunityCardProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const intelligence = getIntelligenceTheme(theme);

  const canCreate = access === 'unlocked' && opportunity.state !== 'unavailable';

  return (
    <View style={[styles.card, { borderColor: intelligence.border }]}>
      <Text style={[styles.typeLabel, { color: intelligence.foreground }]}>{opportunity.typeLabel}</Text>
      <Text style={styles.title}>{opportunity.title}</Text>
      <Text style={styles.explanation}>{opportunity.explanation}</Text>
      <Text style={styles.why}>{opportunity.whyItMatters}</Text>

      <View style={styles.signalRow}>
        <Text style={styles.signalLabel}>Supporting signal</Text>
        <PremiumMetricValue access={access} metric={opportunity.signal} />
      </View>

      <Text style={styles.stateCopy}>
        {opportunity.state === 'loading'
          ? 'Scanning local content patterns…'
          : 'Opportunity details appear when LocalLoop detects a differentiated opening.'}
      </Text>

      <Pressable
        disabled={!canCreate}
        onPress={onStartCreating}
        style={({ pressed }) => [
          styles.createButton,
          !canCreate && styles.createButtonDisabled,
          pressed && canCreate && styles.createButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canCreate }}
        accessibilityLabel="Start Creating">
        <Text style={[styles.createText, !canCreate && styles.createTextDisabled]}>Start Creating</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      padding: 14,
      gap: 8,
    },
    typeLabel: {
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    title: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    explanation: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    why: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      fontStyle: 'italic',
      fontFamily: BrandFonts.regular,
    },
    signalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
    },
    signalLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
    },
    stateCopy: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: BrandFonts.regular,
    },
    createButton: {
      marginTop: 4,
      alignSelf: 'flex-start',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: BrandRadius.pill,
      backgroundColor: theme.emerald,
    },
    createButtonDisabled: {
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    createButtonPressed: {
      opacity: 0.92,
    },
    createText: {
      color: theme.onEmerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    createTextDisabled: {
      color: theme.textMuted,
    },
  });
}
