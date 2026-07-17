import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/account/primary-button';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type ExperienceCardProps = {
  title: string;
  description: string;
  features: string[];
  actionLabel: string;
  selected: boolean;
  onSelect: () => void;
  onAction: () => void;
  loading?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
};

export function ExperienceCard({
  title,
  description,
  features,
  actionLabel,
  selected,
  onSelect,
  onAction,
  loading = false,
  icon,
}: ExperienceCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onSelect();
      }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}>
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons name={icon} size={26} color={selected ? theme.emerald : theme.textSecondary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.emerald} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton label={actionLabel} onPress={onAction} loading={loading} />
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 12,
      ...theme.shadowCard,
    },
    cardSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    cardPressed: {
      opacity: 0.96,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapSelected: {
      backgroundColor: theme.bg,
    },
    title: {
      color: theme.text,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
    },
    featureList: {
      gap: 8,
      marginBottom: 4,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    featureText: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
  });
}
