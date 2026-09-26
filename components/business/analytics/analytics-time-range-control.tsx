import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAnalyticsTimeRange } from '@/contexts/analytics-time-range-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsTimeRangeId } from '@/types/analytics-time-range';
import { listAnalyticsTimeRangeDefinitions } from '@/utils/analytics-time-range';

export function AnalyticsTimeRangeControl() {
  const styles = useThemedStyles(createStyles);
  const { selectedRangeId, setSelectedRangeId, pillLabel } = useAnalyticsTimeRange();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const ranges = listAnalyticsTimeRangeDefinitions();

  const handleSelect = (id: AnalyticsTimeRangeId) => {
    Haptics.selectionAsync();
    setSelectedRangeId(id);
    setSelectorOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectorOpen(true);
        }}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Time range: ${pillLabel}. Tap to change.`}>
        <Ionicons name="calendar-outline" size={16} color={styles.icon.color} />
        <Text style={styles.label}>{pillLabel}</Text>
        <Ionicons name="chevron-down" size={14} color={styles.icon.color} />
      </Pressable>

      <Modal
        visible={selectorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectorOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Time range</Text>
            <View style={styles.optionRow}>
              {ranges.map((range) => {
                const selected = range.id === selectedRangeId;
                return (
                  <Pressable
                    key={range.id}
                    onPress={() => handleSelect(range.id)}
                    style={({ pressed }) => [
                      styles.optionChip,
                      selected && styles.optionChipSelected,
                      pressed && styles.optionChipPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={range.pillLabel}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                      {range.selectorLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: BrandRadius.pill,
      borderWidth: 1,
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    pillPressed: {
      opacity: 0.92,
    },
    icon: {
      color: theme.emerald,
    },
    label: {
      color: theme.text,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    sheet: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 18,
      gap: 14,
      ...theme.shadowCard,
    },
    sheetTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionChip: {
      minWidth: 52,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: BrandRadius.pill,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
    },
    optionChipSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    optionChipPressed: {
      opacity: 0.9,
    },
    optionChipText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.3,
    },
    optionChipTextSelected: {
      color: theme.emerald,
    },
  });
}
