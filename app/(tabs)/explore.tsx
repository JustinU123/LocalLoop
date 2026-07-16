import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { resetOnboarding } from '@/utils/onboarding-storage';

export default function ExploreScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <LocalLoopWordmark style={styles.headerWordmark} />
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>
            Curated collections and neighborhood guides are on the way.
          </Text>
        </View>

        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonIconWrap}>
            <Ionicons name="compass-outline" size={28} color={theme.emerald} />
          </View>
          <Text style={styles.comingSoonTitle}>Coming soon</Text>
          <Text style={styles.comingSoonText}>
            Browse themed local collections, seasonal picks, and editor-curated maps from your
            community.
          </Text>
        </View>

        {__DEV__ ? (
          <Pressable
            onPress={async () => {
              await resetOnboarding();
              router.replace('/onboarding/splash');
            }}
            style={styles.devButton}>
            <Text style={styles.devButtonText}>Replay Onboarding</Text>
          </Pressable>
        ) : null}
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
      paddingBottom: 32,
    },
    header: {
      paddingTop: 4,
      paddingBottom: 20,
    },
    headerWordmark: {
      marginBottom: 10,
    },
    title: {
      color: theme.text,
      fontSize: 34,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
      marginTop: 6,
      lineHeight: 22,
    },
    comingSoonCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      alignItems: 'center',
      ...theme.shadowCard,
    },
    comingSoonIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    comingSoonTitle: {
      color: theme.text,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
      marginBottom: 8,
    },
    comingSoonText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    devButton: {
      marginTop: 24,
      alignSelf: 'flex-start',
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    devButtonText: {
      color: theme.emerald,
      fontFamily: BrandFonts.semiBold,
      fontSize: 14,
    },
  });
}
