import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { ProPerformanceCoachViewModel } from '@/types/analytics-pro-performance';

type ProPerformanceCoachProps = {
  coach: ProPerformanceCoachViewModel;
};

export function ProPerformanceCoach({ coach }: ProPerformanceCoachProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="star" size={14} color={styles.icon.color} />
        </View>
        <Text style={styles.title}>Performance Coach</Text>
      </View>

      {coach.state === 'loading' ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={styles.loader.color} />
          <Text style={styles.loadingCopy}>{coach.explanation}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.headline}>{coach.headline}</Text>
          <Text style={styles.explanation}>{coach.explanation}</Text>

          <View style={styles.nextMoveBlock}>
            <Text style={styles.nextMoveLabel}>NEXT MOVE</Text>
            <Text style={styles.nextMoveBody}>{coach.nextMove}</Text>
          </View>

          <Text style={styles.evidence}>{coach.evidenceLabel}</Text>
        </>
      )}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 3,
      borderLeftColor: theme.emerald,
      padding: 16,
      gap: 10,
      ...theme.shadowCard,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      color: theme.emerald,
    },
    title: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    headline: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
      lineHeight: 21,
    },
    explanation: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: BrandFonts.regular,
    },
    nextMoveBlock: {
      marginTop: 4,
      padding: 12,
      borderRadius: BrandRadius.md,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.borderLight,
      gap: 4,
    },
    nextMoveLabel: {
      color: theme.emerald,
      fontSize: 10,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.6,
    },
    nextMoveBody: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.medium,
    },
    evidence: {
      color: theme.textMuted,
      fontSize: 11,
      fontFamily: BrandFonts.regular,
      lineHeight: 15,
    },
    loadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    loader: {
      color: theme.emerald,
    },
    loadingCopy: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
  });
}
