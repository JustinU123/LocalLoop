import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

/** Icon circle color treatment (Business Pulse rows). */
export type DashboardPulseTone = 'emerald' | 'coral' | 'amber' | 'gold';

/**
 * `performanceInsight` — for analytics-driven copy (e.g. outperforming baseline).
 * Parent supplies real primaryLine/secondaryLine; styling only differs slightly.
 */
export type DashboardPulseContentVariant = 'default' | 'performanceInsight';

type DashboardPulseRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  primaryLine: string;
  secondaryLine?: string | null;
  tone?: DashboardPulseTone;
  contentVariant?: DashboardPulseContentVariant;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function getToneColors(
  theme: AppThemeTokens,
  tone: DashboardPulseTone,
): { icon: string; background: string } {
  switch (tone) {
    case 'coral':
      return {
        icon: theme.coral,
        background: theme.coralGlow,
      };
    case 'amber':
      return {
        icon: theme.star,
        background: 'rgba(245, 197, 66, 0.2)',
      };
    case 'gold':
      return {
        icon: theme.star,
        background: 'rgba(245, 197, 66, 0.14)',
      };
    default:
      return {
        icon: theme.emerald,
        background: theme.emeraldGlow,
      };
  }
}

export function DashboardPulseRow({
  icon,
  primaryLine,
  secondaryLine,
  tone = 'emerald',
  contentVariant = 'default',
  onPress,
  accessibilityLabel,
}: DashboardPulseRowProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const toneColors = getToneColors(theme, tone);
  const showChevron = Boolean(onPress);
  const isPerformanceInsight = contentVariant === 'performanceInsight';

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: toneColors.background }]}>
        <Ionicons name={icon} size={20} color={toneColors.icon} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.primary}>{primaryLine}</Text>
        {secondaryLine ? (
          <Text
            style={[
              styles.secondary,
              isPerformanceInsight && styles.secondaryPerformanceInsight,
            ]}>
            {secondaryLine}
          </Text>
        ) : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={styles.chevron.color} />
      ) : (
        <View style={styles.chevronSpacer} />
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? primaryLine}>
      {content}
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
    },
    rowPressed: {
      opacity: 0.85,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      gap: 2,
      justifyContent: 'center',
      minHeight: 42,
    },
    primary: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
      lineHeight: 20,
    },
    secondary: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
      lineHeight: 18,
    },
    secondaryPerformanceInsight: {
      fontFamily: BrandFonts.medium,
      color: theme.textSecondary,
    },
    chevron: {
      color: theme.textSecondary,
    },
    chevronSpacer: {
      width: 16,
    },
  });
}
