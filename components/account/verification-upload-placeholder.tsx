import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export function VerificationUploadPlaceholder() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="cloud-upload-outline" size={22} color={styles.icon.color} />
      </View>
      <Text style={styles.title}>Document upload coming soon</Text>
      <Text style={styles.body}>
        File uploads are not connected yet. Use the explanation field below to describe the proof
        you can provide.
      </Text>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      backgroundColor: theme.surfaceElevated,
      padding: 16,
      alignItems: 'center',
      gap: 8,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      color: theme.textSecondary,
    },
    title: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
      textAlign: 'center',
    },
    body: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
