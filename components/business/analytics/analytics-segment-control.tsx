import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { ANALYTICS_SEGMENTS, type AnalyticsSegmentId } from '@/types/analytics-segments';
import { getIntelligenceTheme } from '@/utils/analytics-intelligence-theme';
type AnalyticsSegmentControlProps = {
  activeSegment: AnalyticsSegmentId;
  onSelect: (segment: AnalyticsSegmentId) => void;
};

export function AnalyticsSegmentControl({ activeSegment, onSelect }: AnalyticsSegmentControlProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const intelligence = getIntelligenceTheme(theme);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}>
      {ANALYTICS_SEGMENTS.map((segment) => {
        const selected = activeSegment === segment.id;
        const isIntelligence = segment.variant === 'intelligence';

        return (
          <Pressable
            key={segment.id}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(segment.id);
            }}
            style={[
              styles.segment,
              selected && !isIntelligence && styles.segmentSelected,
              isIntelligence && {
                borderColor: intelligence.border,
                backgroundColor: intelligence.backgroundElevated,
              },
              selected && isIntelligence && {
                borderColor: intelligence.foreground,
                backgroundColor: intelligence.glow,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={segment.accessibilityLabel}>
            {isIntelligence ? (
              <View style={styles.intelligenceLabelRow}>
                <Ionicons
                  name="sparkles"
                  size={13}
                  color={selected ? intelligence.foreground : intelligence.foregroundMuted}
                />
                <Text
                  style={[
                    styles.segmentLabel,
                    { color: intelligence.foregroundMuted },
                    selected && { color: intelligence.foreground },
                  ]}>
                  {segment.pillLabel}
                </Text>
              </View>
            ) : (
              <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                {segment.pillLabel}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    scroll: {
      marginHorizontal: -4,
    },
    scrollContent: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    segment: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.pill,
      paddingVertical: 10,
      paddingHorizontal: 14,
      minHeight: 40,
      justifyContent: 'center',
    },
    segmentSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    segmentLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    segmentLabelSelected: {
      color: theme.emerald,
    },
    intelligenceLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
  });
}
