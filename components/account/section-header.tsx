import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type SectionHeaderProps = {
  label: string;
  hint?: string;
};

export function SectionHeader({ label, hint }: SectionHeaderProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      gap: 4,
      marginBottom: 8,
    },
    label: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    hint: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
  });
}
