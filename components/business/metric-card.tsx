import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type MetricCardProps = {
  label: string;
  value: string;
};

export function MetricCard({ label, value }: MetricCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 4,
      ...theme.shadowCard,
    },
    value: {
      color: theme.text,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
    },
    label: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
    },
  });
}
