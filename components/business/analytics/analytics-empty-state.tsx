import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type AnalyticsEmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
};

export function AnalyticsEmptyState({
  icon = 'analytics-outline',
  title,
  message,
}: AnalyticsEmptyStateProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={styles.icon.color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 16,
      gap: 8,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: BrandRadius.pill,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    icon: {
      color: theme.emerald,
    },
    title: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
      textAlign: 'center',
    },
    message: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
