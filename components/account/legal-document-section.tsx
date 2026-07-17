import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type LegalDocumentSectionProps = {
  title: string;
  body: string;
};

export function LegalDocumentSection({ title, body }: LegalDocumentSectionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    section: {
      gap: 8,
      marginBottom: 18,
    },
    title: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    body: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
  });
}
