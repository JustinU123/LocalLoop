import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export type SegmentedOption<T extends string> = {
  id: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  selectedId,
  onSelect,
}: SegmentedControlProps<T>) {
  const styles = useThemedStyles(createStyles);

  const handleSelect = (id: T) => {
    if (id === selectedId) return;
    Haptics.selectionAsync();
    onSelect(id);
  };

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.id === selectedId;

        return (
          <Pressable
            key={option.id}
            onPress={() => handleSelect(option.id)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && styles.segmentPressed,
            ]}>
            <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceElevated,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
    },
    segmentSelected: {
      backgroundColor: theme.emerald,
      ...theme.shadowButton,
    },
    segmentPressed: {
      opacity: 0.92,
    },
    segmentLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    segmentLabelSelected: {
      color: theme.onEmerald,
    },
  });
}
