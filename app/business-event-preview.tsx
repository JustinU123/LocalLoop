import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { EventPreviewCard } from '@/components/business/event-preview-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { EVENT_PUBLISH_MESSAGE } from '@/constants/event-create';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessEventGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { EventDraft } from '@/types/event-draft';
import {
  clearEventDraft,
  getBusinessAddressLabel,
  getEventDraft,
} from '@/utils/event-form';

export default function BusinessEventPreviewScreen() {
  useVerifiedBusinessEventGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { businessApplication } = useAccountMode();
  const [draft, setDraft] = useState<EventDraft | null>(null);

  useEffect(() => {
    const nextDraft = getEventDraft();
    if (!nextDraft) {
      router.replace('/business-create-event');
      return;
    }
    setDraft(nextDraft);
  }, []);

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';
  const businessAddress = getBusinessAddressLabel(businessApplication);

  const handlePublish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Coming next', EVENT_PUBLISH_MESSAGE);
  };

  const handleBackToEdit = () => {
    router.back();
  };

  if (!draft || !canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Event Preview" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Event Preview" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Preview how this event may appear to LocalLoop customers. Nothing is published yet.
        </Text>

        <EventPreviewCard
          draft={draft}
          businessName={businessName}
          businessAddress={businessAddress}
          verified
        />

        <View style={styles.actions}>
          <PrimaryButton label="Publish Event" onPress={handlePublish} />
          <Pressable onPress={handleBackToEdit} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back to Edit</Text>
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
  });
}
