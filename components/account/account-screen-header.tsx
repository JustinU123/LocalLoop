import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type AccountScreenHeaderProps = {
  title: string;
};

export function AccountScreenHeader({ title }: AccountScreenHeaderProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={theme.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      paddingTop: 4,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    headerSpacer: {
      width: 40,
    },
  });
}
