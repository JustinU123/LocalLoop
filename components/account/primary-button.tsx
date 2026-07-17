import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, loading = false, disabled = false }: PrimaryButtonProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={styles.label.color} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    button: {
      backgroundColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowButton,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    label: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
