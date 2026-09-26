import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type PublicProfileTabEmptyProps = {
  title: string;
  message: string;
};

export function PublicProfileTabEmpty({ title, message }: PublicProfileTabEmptyProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      marginBottom: 12,
      ...theme.shadowCard,
    },
    title: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
      marginBottom: 6,
    },
    message: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
  });
}
