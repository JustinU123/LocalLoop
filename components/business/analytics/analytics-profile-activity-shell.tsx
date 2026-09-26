import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export function AnalyticsProfileActivityShell() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <View style={styles.chartArea}>
        {[0, 1, 2, 3].map((line) => (
          <View key={line} style={[styles.gridLine, { top: `${18 + line * 22}%` }]} />
        ))}
        <View style={styles.baseline} />
        <View style={styles.tickRow}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View key={index} style={styles.tick} />
          ))}
        </View>
        <View style={styles.linePlaceholder} pointerEvents="none">
          <View style={[styles.lineSegment, styles.lineSegmentA]} />
          <View style={[styles.lineSegment, styles.lineSegmentB]} />
          <View style={[styles.lineSegment, styles.lineSegmentC]} />
        </View>
        <View style={styles.chartIconWrap}>
          <Ionicons name="analytics-outline" size={22} color={styles.chartIcon.color} />
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Your activity over time will appear here</Text>
        <Text style={styles.message}>
          As LocalLoop collects profile activity, you&apos;ll see your 7-day trend here.
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      padding: 16,
      gap: 14,
    },
    chartArea: {
      height: 148,
      borderRadius: BrandRadius.md,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.borderLight,
      overflow: 'hidden',
      position: 'relative',
    },
    gridLine: {
      position: 'absolute',
      left: 12,
      right: 12,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      opacity: 0.65,
    },
    baseline: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 28,
      height: 1,
      backgroundColor: theme.border,
    },
    tickRow: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tick: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.border,
      opacity: 0.8,
    },
    linePlaceholder: {
      position: 'absolute',
      left: 20,
      right: 24,
      bottom: 36,
      height: 64,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      opacity: 0.35,
    },
    lineSegment: {
      flex: 1,
      borderRadius: 4,
      backgroundColor: theme.emerald,
    },
    lineSegmentA: {
      height: '32%',
    },
    lineSegmentB: {
      height: '58%',
    },
    lineSegmentC: {
      height: '44%',
    },
    chartIconWrap: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartIcon: {
      color: theme.emerald,
    },
    copy: {
      gap: 6,
      paddingHorizontal: 2,
    },
    title: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    message: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
  });
}
