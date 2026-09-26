import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnalyticsLockedPreviewVeil } from '@/components/business/analytics/analytics-locked-preview-veil';
import type { AnalyticsLockedPreviewVeilVariant } from '@/components/business/analytics/analytics-locked-preview-veil';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsFeatureAccess } from '@/types/analytics-access';
import { openAnalyticsUpgrade } from '@/utils/open-analytics-upgrade';

type AnalyticsFeatureShellProps = {
  access: AnalyticsFeatureAccess;
  title: string;
  description: string;
  upgradeSource: string;
  /** Fixed height for locked preview viewport (clips real Premium UI). */
  lockedViewportHeight?: number;
  lockedVeilVariant?: AnalyticsLockedPreviewVeilVariant;
  children: React.ReactNode;
};

export function AnalyticsFeatureShell({
  access,
  title,
  description,
  upgradeSource,
  lockedViewportHeight = 300,
  lockedVeilVariant = 'default',
  children,
}: AnalyticsFeatureShellProps) {
  const styles = useThemedStyles(createStyles);

  if (access === 'unlocked') {
    return (
      <View style={styles.unlockedRoot}>
        <Text style={styles.unlockedTitle}>{title}</Text>
        <Text style={styles.unlockedDescription}>{description}</Text>
        {children}
      </View>
    );
  }

  const handlePress = () => {
    openAnalyticsUpgrade(upgradeSource);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Unlock Premium`}>
      <View style={styles.crispHeader} pointerEvents="none">
        <View style={styles.premiumPill}>
          <Text style={styles.premiumPillText}>PREMIUM PREVIEW</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={[styles.vizFrame, { height: lockedViewportHeight }]}>
        <View style={styles.vizClip} pointerEvents="none">
          <View style={styles.vizContentDimmed}>{children}</View>
        </View>
        <AnalyticsLockedPreviewVeil variant={lockedVeilVariant} />
      </View>

      <View style={styles.ctaButton}>
        <Text style={styles.ctaText}>Unlock Premium</Text>
        <Ionicons name="arrow-forward" size={18} color={styles.ctaText.color} />
      </View>
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    unlockedRoot: {
      gap: 12,
    },
    unlockedTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    unlockedDescription: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 14,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    cardPressed: {
      opacity: 0.96,
    },
    crispHeader: {
      gap: 8,
    },
    premiumPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: BrandRadius.pill,
      backgroundColor: 'rgba(245, 197, 66, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(245, 197, 66, 0.4)',
    },
    premiumPillText: {
      color: theme.star,
      fontSize: 10,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.8,
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    vizFrame: {
      position: 'relative',
      borderRadius: BrandRadius.md,
      backgroundColor: theme.isDark ? '#0a0c0e' : theme.surfaceSecondary,
      borderWidth: 1,
      borderColor: theme.borderLight,
      overflow: 'hidden',
    },
    vizClip: {
      flex: 1,
      overflow: 'hidden',
    },
    vizContentDimmed: {
      opacity: theme.isDark ? 0.2 : 0.22,
      padding: 10,
      paddingBottom: 16,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      paddingVertical: 14,
      borderRadius: BrandRadius.pill,
      backgroundColor: theme.emerald,
      ...theme.shadowButton,
    },
    ctaText: {
      color: theme.onEmerald,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
  });
}
