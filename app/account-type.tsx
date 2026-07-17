import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { ExperienceCard } from '@/components/account/experience-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { isExplorerAccountType } from '@/utils/account-experience';

type ExperienceChoice = 'explorer' | 'business';

const EXPLORER_FEATURES = [
  'Discover local businesses',
  'Browse photo and video posts',
  'Follow and save favorites',
  'Find nearby promotions',
  'Use the LocalLoop map',
];

const BUSINESS_FEATURES = [
  'Create a business profile',
  'Publish photos and videos',
  'Post promotions',
  'Track future business insights',
  'Respond to reviews',
  'Reach nearby customers',
];

export default function AccountTypeSelectionScreen() {
  const styles = useThemedStyles(createStyles);
  const { accountType, verificationStatus, setLocalExplorerExperience } = useAccountMode();
  const [selected, setSelected] = useState<ExperienceChoice>(() => {
    if (accountType === 'business' || verificationStatus !== 'not_submitted') {
      return 'business';
    }
    if (isExplorerAccountType(accountType)) {
      return 'explorer';
    }
    return 'explorer';
  });
  const [savingExplorer, setSavingExplorer] = useState(false);

  const handleContinueExplorer = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavingExplorer(true);
    try {
      const saved = await setLocalExplorerExperience();
      if (saved) {
        router.back();
      }
    } finally {
      setSavingExplorer(false);
    }
  };

  const handleApplyBusiness = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/business-verification');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Choose Your Experience" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Choose how you want to use LocalLoop. Business owners can still discover and explore local
          businesses.
        </Text>

        <ExperienceCard
          title="Local Explorer"
          description="Discover independent businesses, explore local posts, follow favorites, save places, and find nearby promotions."
          features={EXPLORER_FEATURES}
          actionLabel="Continue as Local Explorer"
          selected={selected === 'explorer'}
          onSelect={() => setSelected('explorer')}
          onAction={handleContinueExplorer}
          loading={savingExplorer}
          icon="compass-outline"
        />

        <ExperienceCard
          title="Business Owner"
          description="Create and manage a business presence, publish posts and promotions, build a following, and reach nearby customers."
          features={BUSINESS_FEATURES}
          actionLabel="Apply for Business Access"
          selected={selected === 'business'}
          onSelect={() => setSelected('business')}
          onAction={handleApplyBusiness}
          icon="storefront-outline"
        />
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
      gap: 16,
    },
    intro: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      marginBottom: 4,
    },
  });
}
