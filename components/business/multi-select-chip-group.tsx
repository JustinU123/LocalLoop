import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type MultiSelectChipGroupProps<T extends string> = {
  label: string;
  options: { id: T; label: string }[];
  value: T[];
  onChange: (value: T[]) => void;
  error?: string;
  helperText?: string;
};

export function MultiSelectChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
}: MultiSelectChipGroupProps<T>) {
  const styles = useThemedStyles(createStyles);

  const toggleValue = (optionId: T) => {
    Haptics.selectionAsync();
    if (value.includes(optionId)) {
      onChange(value.filter((item) => item !== optionId));
      return;
    }
    onChange([...value, optionId]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = value.includes(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => toggleValue(option.id)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}>
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    helperText: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipSelected: {
      borderColor: theme.coral,
      backgroundColor: theme.coralGlow,
    },
    chipPressed: {
      opacity: 0.92,
    },
    chipLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    chipLabelSelected: {
      color: theme.coral,
    },
    error: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
  });
}
