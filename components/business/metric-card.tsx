import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export type MetricTrendDirection = 'up' | 'down' | 'neutral';

export type MetricIconTone = 'emerald' | 'amber' | 'gold' | 'coral' | 'blue';

type MetricCardProps = {
  label: string;
  value: string;
  /** Use in tight multi-column rows (e.g. dashboard At a Glance). */
  compact?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: MetricIconTone;
  /** Whole-number percent change; omit when no real trend data exists. */
  trendPercent?: number | null;
  trendDirection?: MetricTrendDirection;
  /** Optional muted caption above the trend row (e.g. comparison period). */
  trendLabel?: string | null;
};

function formatTrendPercent(value: number): string {
  const rounded = Math.round(Math.abs(value));
  return `${rounded}%`;
}

export function MetricCard({
  label,
  value,
  compact = false,
  icon,
  iconTone = 'emerald',
  trendPercent,
  trendDirection,
  trendLabel,
}: MetricCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const showTrend =
    typeof trendPercent === 'number' &&
    Number.isFinite(trendPercent) &&
    trendDirection !== undefined;

  const iconColors = getIconToneColors(theme, iconTone);

  let trendColor = theme.textMuted;
  let trendArrow = '→';
  if (showTrend && trendDirection) {
    if (trendDirection === 'up') {
      trendColor = theme.emerald;
      trendArrow = '↑';
    } else if (trendDirection === 'down') {
      trendColor = theme.danger;
      trendArrow = '↓';
    }
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconColors.background }]}>
          <Ionicons name={icon} size={compact ? 16 : 18} color={iconColors.foreground} />
        </View>
      ) : null}
      <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
      <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={2}>
        {label}
      </Text>
      {trendLabel ? <Text style={styles.trendCaption}>{trendLabel}</Text> : null}
      {showTrend ? (
        <Text style={[styles.trend, { color: trendColor }]}>
          {trendArrow} {formatTrendPercent(trendPercent!)}
        </Text>
      ) : null}
    </View>
  );
}

function getIconToneColors(
  theme: AppThemeTokens,
  tone: MetricIconTone,
): { foreground: string; background: string } {
  switch (tone) {
    case 'amber':
      return {
        foreground: theme.star,
        background: 'rgba(245, 197, 66, 0.18)',
      };
    case 'gold':
      return {
        foreground: theme.star,
        background: 'rgba(245, 197, 66, 0.12)',
      };
    case 'coral':
      return {
        foreground: theme.coral,
        background: theme.coralGlow,
      };
    case 'blue':
      return {
        foreground: theme.isDark ? '#7DD3FC' : '#0284C7',
        background: theme.isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(14, 165, 233, 0.12)',
      };
    default:
      return {
        foreground: theme.emerald,
        background: theme.emeraldGlow,
      };
  }
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 4,
      ...theme.shadowCard,
    },
    cardCompact: {
      minWidth: 0,
      padding: 11,
      gap: 3,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    value: {
      color: theme.text,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
    },
    valueCompact: {
      fontSize: 20,
      letterSpacing: -0.3,
    },
    label: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
      lineHeight: 16,
    },
    labelCompact: {
      fontSize: 11,
      lineHeight: 14,
    },
    trendCaption: {
      color: theme.textMuted,
      fontSize: 10,
      fontFamily: BrandFonts.regular,
      marginTop: 1,
    },
    trend: {
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
      marginTop: 1,
    },
  });
}
