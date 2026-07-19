import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { PromotionPreviewCard } from '@/components/business/promotion-preview-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { PROMOTION_PUBLISH_MESSAGE } from '@/constants/promotion-create';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessPromotionGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { PromotionDraft } from '@/types/promotion-draft';
import { clearPromotionDraft, getPromotionDraft } from '@/utils/promotion-form';

export default function BusinessPromotionPreviewScreen() {
  useVerifiedBusinessPromotionGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { businessApplication } = useAccountMode();
  const [draft, setDraft] = useState<PromotionDraft | null>(null);

  useEffect(() => {
    const nextDraft = getPromotionDraft();
    if (!nextDraft) {
      router.replace('/business-create-promotion');
      return;
    }
    setDraft(nextDraft);
  }, []);

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';

  const handlePublish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Coming next', PROMOTION_PUBLISH_MESSAGE);
  };

  const handleBackToEdit = () => {
    router.back();
  };

  const handleCancel = () => {
    clearPromotionDraft();
    router.replace('/(business-tabs)/create');
  };

  if (!draft || !canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Promotion Preview" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Promotion Preview" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Preview how this promotion may appear to LocalLoop customers. Nothing is published yet.
        </Text>

        <PromotionPreviewCard draft={draft} businessName={businessName} verified />

        <View style={styles.actions}>
          <PrimaryButton label="Publish Promotion" onPress={handlePublish} />
          <Pressable onPress={handleBackToEdit} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back to Edit</Text>
          </Pressable>
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
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
    },
    actions: {
      gap: 12,
      marginTop: 4,
    },
    secondaryButton: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
      borderRadius: 16,
      paddingVertical: 14,
    },
    secondaryButtonText: {
      color: theme.emerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    cancelButton: {
      alignSelf: 'center',
      paddingVertical: 8,
    },
    cancelText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
