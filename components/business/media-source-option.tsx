import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type MediaSourceOptionProps = {
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: 'emerald' | 'coral';
  onPress: () => void;
  disabled?: boolean;
};

export function MediaSourceOption({
  label,
  description,
  icon,
  accent = 'coral',
  onPress,
  disabled = false,
}: MediaSourceOptionProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const accentColor = accent === 'coral' ? theme.coral : theme.emerald;
  const accentGlow = accent === 'coral' ? theme.coralGlow : theme.emeraldGlow;

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        pressed && !disabled && styles.optionPressed,
        disabled && styles.optionDisabled,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: accentGlow }]}>
        <Ionicons name={icon} size={22} color={accentColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      ...theme.shadowCard,
    },
    optionPressed: {
      backgroundColor: theme.surfaceElevated,
    },
    optionDisabled: {
      opacity: 0.6,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
      gap: 3,
    },
    label: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
  });
}
