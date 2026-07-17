import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { Ionicons } from '@expo/vector-icons';

export default function CurrentModeScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { activeAppMode, switchToExplorerMode, switchToBusinessDashboard } = useAccountMode();

  const options = [
    {
      id: 'explorer' as const,
      title: 'Local Explorer',
      description: 'Browse Home, Explore, Promotions, and Saved as a consumer.',
      icon: 'compass-outline' as const,
    },
    {
      id: 'business' as const,
      title: 'Business Dashboard',
      description: 'Manage your business presence, create content, and review activity.',
      icon: 'storefront-outline' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Current Mode" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Switch between your personal discovery experience and your verified business dashboard.
        </Text>

        {options.map((option) => {
          const selected = activeAppMode === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => {
                Haptics.selectionAsync();
                if (option.id === 'explorer') {
                  void switchToExplorerMode();
                  return;
                }
                void switchToBusinessDashboard();
              }}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}>
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={selected ? theme.emerald : theme.textSecondary}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </View>
              {selected ? (
                <Ionicons name="checkmark-circle" size={22} color={theme.emerald} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              )}
            </Pressable>
          );
        })}

        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to Account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 14,
    },
    intro: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      marginBottom: 4,
    },
    card: {
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
    cardSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    cardPressed: {
      opacity: 0.96,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapSelected: {
      backgroundColor: theme.bg,
    },
    cardText: {
      flex: 1,
      gap: 4,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
    },
    cardDescription: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    backLink: {
      alignSelf: 'center',
      marginTop: 8,
      paddingVertical: 8,
    },
    backLinkText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
