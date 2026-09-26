import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsMetricAvailability } from '@/types/analytics-basic';
import { getAnalyticsVisualTone, type AnalyticsVisualTone } from '@/utils/analytics-visual-tones';

type AnalyticsMetricCardProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTone?: AnalyticsVisualTone;
  availability?: AnalyticsMetricAvailability;
  unavailableHint?: string | null;
  loading?: boolean;
  /** Full-width hero treatment (Audience total followers). */
  variant?: 'default' | 'hero';
};

export function AnalyticsMetricCard({
  label,
  value,
  icon,
  iconTone = 'emerald',
  availability = 'ready',
  unavailableHint,
  loading = false,
  variant = 'default',
}: AnalyticsMetricCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const colors = getAnalyticsVisualTone(theme, iconTone);
  const showHint = availability === 'unavailable' && unavailableHint?.trim();
  const isHero = variant === 'hero';

  return (
    <View
      style={[
        styles.card,
        isHero && styles.cardHero,
        { borderTopColor: colors.border },
      ]}>
      <View
        style={[
          styles.iconWrap,
          isHero && styles.iconWrapHero,
          { backgroundColor: colors.background },
        ]}>
        <Ionicons name={icon} size={isHero ? 26 : 22} color={colors.foreground} />
      </View>
      <Text style={[styles.value, isHero && styles.valueHero]}>{loading ? '…' : value}</Text>
      <Text style={[styles.label, isHero && styles.labelHero]} numberOfLines={2}>
        {label}
      </Text>
      {showHint ? <Text style={styles.hint}>{unavailableHint}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      borderTopWidth: 3,
      padding: 16,
      gap: 8,
      ...theme.shadowCard,
    },
    cardHero: {
      minWidth: '100%',
      paddingVertical: 20,
      paddingHorizontal: 18,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapHero: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    value: {
      color: theme.text,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.6,
      marginTop: 2,
    },
    valueHero: {
      fontSize: 40,
      letterSpacing: -1,
    },
    label: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    labelHero: {
      fontSize: 15,
    },
    hint: {
      color: theme.textMuted,
      fontSize: 11,
      lineHeight: 15,
      fontFamily: BrandFonts.regular,
    },
  });
}
