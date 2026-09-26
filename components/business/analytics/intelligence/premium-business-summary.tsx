import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BusinessSummaryCardHeader,
  BusinessSummaryCardShell,
} from '@/components/business/analytics/intelligence/business-summary-card-shell';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAnalyticsNavigation } from '@/contexts/analytics-navigation-context';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { useTypewriterReveal } from '@/hooks/use-typewriter-reveal';
import type { PremiumBusinessSummaryViewModel } from '@/types/analytics-business-summary';

type PremiumBusinessSummaryProps = {
  summary: PremiumBusinessSummaryViewModel;
  replayEpoch: number;
  summaryPlayedKey: string | null;
  onSummaryPlayed: (contentKey: string) => void;
};

export function PremiumBusinessSummary({
  summary,
  replayEpoch,
  summaryPlayedKey,
  onSummaryPlayed,
}: PremiumBusinessSummaryProps) {
  const styles = useThemedStyles(createStyles);
  const { goToIntelligence } = useAnalyticsNavigation();
  const reduceMotion = useReduceMotion();

  const isLoading = summary.availability.state === 'loading';
  const bodyText =
    summary.availability.state === 'ready' || summary.availability.state === 'sparse'
      ? summary.availability.body
      : '';

  const alreadyPlayed = summaryPlayedKey === summary.contentKey;

  const typedBody = useTypewriterReveal({
    fullText: bodyText,
    active: !isLoading && bodyText.length > 0 && !alreadyPlayed,
    charDelayMs: 28,
    startDelayMs: 450,
    reduceMotion: reduceMotion || alreadyPlayed,
    replayEpoch,
  });

  const displayedBody = isLoading
    ? 'Analyzing your business…'
    : alreadyPlayed || reduceMotion
      ? bodyText
      : typedBody;

  useEffect(() => {
    if (
      !isLoading &&
      bodyText.length > 0 &&
      (reduceMotion || alreadyPlayed || typedBody.length >= bodyText.length)
    ) {
      onSummaryPlayed(summary.contentKey);
    }
  }, [
    isLoading,
    bodyText,
    reduceMotion,
    alreadyPlayed,
    typedBody,
    summary.contentKey,
    onSummaryPlayed,
  ]);

  const chips =
    summary.availability.state === 'ready' || summary.availability.state === 'sparse'
      ? summary.availability.chips
      : [];

  const showChips =
    !isLoading &&
    chips.length > 0 &&
    (reduceMotion || alreadyPlayed || typedBody.length >= bodyText.length);

  return (
    <BusinessSummaryCardShell>
      <BusinessSummaryCardHeader />

      <Text style={styles.body} accessibilityLiveRegion="polite">
        {displayedBody}
      </Text>

      {showChips ? (
        <View style={styles.chipRow}>
          {chips.map((chip) => (
            <View key={chip.id} style={styles.chip}>
              <Text style={styles.chipText}>{chip.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => goToIntelligence()}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        accessibilityRole="button"
        accessibilityLabel="View Competitive Intelligence">
        <Text style={styles.ctaText}>View Competitive Intelligence</Text>
        <Ionicons name="arrow-forward" size={16} color={styles.ctaText.color} />
      </Pressable>
    </BusinessSummaryCardShell>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    body: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      minHeight: 44,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: BrandRadius.pill,
      borderWidth: 1,
      borderColor: theme.borderLight,
      backgroundColor: theme.surfaceElevated,
    },
    chipText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      marginTop: 2,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: BrandRadius.pill,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
    },
    ctaPressed: {
      opacity: 0.92,
    },
    ctaText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
