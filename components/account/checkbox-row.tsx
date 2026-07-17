import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type CheckboxRowProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

export function CheckboxRow({ label, checked, onToggle }: CheckboxRowProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={14} color={theme.onEmerald} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      padding: 14,
    },
    rowPressed: {
      backgroundColor: theme.surfaceElevated,
    },
    box: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    boxChecked: {
      backgroundColor: theme.emerald,
      borderColor: theme.emerald,
    },
    label: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.medium,
    },
  });
}
