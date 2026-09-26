import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getIntelligenceTheme } from '@/utils/analytics-intelligence-theme';

type BusinessSummaryCardShellProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function BusinessSummaryCardShell({ children, style }: BusinessSummaryCardShellProps) {
  const { theme } = useAppTheme();
  const intelligence = getIntelligenceTheme(theme);
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: intelligence.border,
          backgroundColor: intelligence.background,
        },
        style,
      ]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: intelligence.gradientTop, opacity: 0.9 }]}
      />
      <View pointerEvents="none" style={[styles.innerGlow, { backgroundColor: intelligence.glow }]} />
      <View pointerEvents="none" style={styles.sparkleCluster}>
        <Ionicons name="sparkles" size={14} color={intelligence.foregroundMuted} style={styles.sparkleA} />
        <Ionicons name="sparkles" size={20} color={intelligence.foreground} style={styles.sparkleB} />
        <Ionicons name="sparkles" size={11} color={intelligence.foregroundMuted} style={styles.sparkleC} />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export function BusinessSummaryCardHeader() {
  const { theme } = useAppTheme();
  const intelligence = getIntelligenceTheme(theme);
  const styles = useThemedStyles(createHeaderStyles);

  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        <Ionicons name="sparkles" size={16} color={intelligence.foreground} />
        <Text style={[styles.title, { color: intelligence.foreground }]}>Business Summary</Text>
      </View>
      <View style={[styles.premiumPill, { borderColor: intelligence.border }]}>
        <Text style={[styles.premiumPillText, { color: intelligence.foreground }]}>PREMIUM</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    innerGlow: {
      position: 'absolute',
      left: -20,
      right: -20,
      top: -30,
      height: 120,
      opacity: 0.55,
    },
    sparkleCluster: {
      position: 'absolute',
      top: 10,
      right: 12,
      width: 56,
      height: 40,
    },
    sparkleA: {
      position: 'absolute',
      top: 4,
      right: 28,
      opacity: 0.75,
    },
    sparkleB: {
      position: 'absolute',
      top: 0,
      right: 6,
    },
    sparkleC: {
      position: 'absolute',
      top: 18,
      right: 0,
      opacity: 0.65,
    },
    content: {
      padding: 16,
      gap: 12,
    },
  });
}

function createHeaderStyles(_theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    title: {
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    premiumPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BrandRadius.pill,
      borderWidth: 1,
      backgroundColor: 'rgba(45, 212, 191, 0.08)',
    },
    premiumPillText: {
      fontSize: 9,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.7,
    },
  });
}
