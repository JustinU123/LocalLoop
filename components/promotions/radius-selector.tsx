import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { RADIUS_OPTIONS, type RadiusOption } from '@/data/promotions';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type RadiusSelectorProps = {
  selectedRadius: RadiusOption;
  onSelect: (radius: RadiusOption) => void;
};

export function RadiusSelector({ selectedRadius, onSelect }: RadiusSelectorProps) {
  const styles = useThemedStyles(createStyles);

  const handleSelect = (radius: RadiusOption) => {
    if (radius === selectedRadius) return;
    Haptics.selectionAsync();
    onSelect(radius);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {RADIUS_OPTIONS.map((radius) => {
        const selected = radius === selectedRadius;

        return (
          <Pressable
            key={radius}
            onPress={() => handleSelect(radius)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}>
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{radius} mi</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: BrandRadius.pill,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
    },
    chipSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    chipPressed: {
      opacity: 0.92,
    },
    chipLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    chipLabelSelected: {
      color: theme.emerald,
    },
  });
}
