import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export type AnalyticsLockedPreviewVeilVariant = 'default' | 'intelligence';

type AnalyticsLockedPreviewVeilProps = {
  variant?: AnalyticsLockedPreviewVeilVariant;
};

/**
 * Neutral frost + dark veil over locked Premium UI. No colored blob gradients.
 * True BlurView is not in the project; layered overlays reduce readability instead.
 */
export function AnalyticsLockedPreviewVeil({ variant = 'default' }: AnalyticsLockedPreviewVeilProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root} pointerEvents="none">
      {variant === 'intelligence' ? <View style={styles.intelligenceGlow} /> : null}

      <View style={styles.frostPrimary} />
      <View style={styles.frostSecondary} />
      <View style={styles.neutralVeil} />
      <View style={styles.topFade} />
      <View style={styles.bottomFade} />

      <View style={styles.lockCenter}>
        <View style={styles.lockCircle}>
          <Ionicons name="lock-closed" size={22} color={styles.lockIcon.color} />
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  const scrim = theme.isDark ? 'rgb(6, 8, 10)' : 'rgb(245, 247, 248)';
  const frost = theme.isDark ? 'rgba(240, 253, 250, 0.06)' : 'rgba(255, 255, 255, 0.72)';

  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFill,
      zIndex: 2,
    },
    intelligenceGlow: {
      position: 'absolute',
      alignSelf: 'center',
      top: '22%',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: theme.isDark ? 'rgba(45, 212, 191, 0.12)' : 'rgba(20, 184, 166, 0.1)',
    },
    frostPrimary: {
      ...StyleSheet.absoluteFill,
      backgroundColor: frost,
    },
    frostSecondary: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.isDark ? 'rgba(8, 10, 12, 0.62)' : 'rgba(248, 250, 252, 0.55)',
    },
    neutralVeil: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.38)' : 'rgba(15, 23, 42, 0.12)',
    },
    topFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '18%',
      backgroundColor: scrim,
      opacity: theme.isDark ? 0.35 : 0.25,
    },
    bottomFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '38%',
      backgroundColor: scrim,
      opacity: theme.isDark ? 0.72 : 0.55,
    },
    lockCenter: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lockCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.isDark ? 'rgba(18, 20, 22, 0.92)' : 'rgba(255, 255, 255, 0.94)',
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowCard,
    },
    lockIcon: {
      color: theme.textSecondary,
    },
  });
}
