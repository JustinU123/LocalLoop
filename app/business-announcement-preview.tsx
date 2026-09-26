import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { AnnouncementPreviewCard } from '@/components/business/announcement-preview-card';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessAnnouncementGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { publishAnnouncement } from '@/services/posts';
import type { AnnouncementDraft } from '@/types/announcement-draft';
import { clearAnnouncementDraft, getAnnouncementDraft } from '@/utils/announcement-form';
import { openBusinessProfile } from '@/utils/open-business-profile';

type PublishOverlayPhase = 'idle' | 'loading' | 'success';

export default function BusinessAnnouncementPreviewScreen() {
  useVerifiedBusinessAnnouncementGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { businessApplication, businessRecord } = useAccountMode();
  const [draft, setDraft] = useState<AnnouncementDraft | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<PublishOverlayPhase>('idle');
  const [publishedBusinessId, setPublishedBusinessId] = useState<string | null>(null);
  const publishInFlightRef = useRef(false);
  const overlayActive = overlayPhase !== 'idle';

  useEffect(() => {
    const nextDraft = getAnnouncementDraft();
    if (!nextDraft) {
      router.replace('/business-create-announcement');
      return;
    }
    setDraft(nextDraft);
  }, []);

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';

  const handleDoneAfterSuccess = () => {
    router.replace('/(business-tabs)/create');
  };

  const handleViewAnnouncementAfterPublish = () => {
    const businessId = publishedBusinessId ?? businessRecord?.id?.trim();
    if (!businessId) {
      handleDoneAfterSuccess();
      return;
    }

    router.replace('/(business-tabs)/create');
    openBusinessProfile(businessId, {
      tab: 'posts',
      source: 'announcement-publish',
    });
  };

  const handlePublish = async () => {
    if (!draft || publishInFlightRef.current || isPublishing) {
      return;
    }

    publishInFlightRef.current = true;
    setIsPublishing(true);
    setOverlayPhase('loading');

    try {
      const result = await publishAnnouncement({
        title: draft.title,
        message: draft.message,
      });

      if (!result.ok) {
        setOverlayPhase('idle');
        Alert.alert('Unable to publish', result.message);
        return;
      }

      clearAnnouncementDraft();
      setPublishedBusinessId(result.post.businessId);
      setOverlayPhase('success');
    } finally {
      publishInFlightRef.current = false;
      setIsPublishing(false);
    }
  };

  const handleBackToEdit = () => {
    router.back();
  };

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Announcement Preview" />
      </SafeAreaView>
    );
  }

  if (!draft && overlayPhase === 'idle') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Announcement Preview" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Announcement Preview" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEnabled={!overlayActive}>
        <Text style={styles.intro}>
          Preview how this announcement may appear on your business profile. Nothing is published
          yet.
        </Text>

        <AnnouncementPreviewCard draft={draft!} businessName={businessName} verified />

        <View style={styles.actions}>
          <PrimaryButton
            label="Publish Announcement"
            onPress={handlePublish}
            loading={isPublishing && overlayPhase === 'loading'}
            disabled={overlayActive}
          />
          <Pressable onPress={handleBackToEdit} style={styles.secondaryButton} disabled={overlayActive}>
            <Text style={styles.secondaryButtonText}>Back to Edit</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BusinessSuccessOverlay
        visible={overlayActive}
        phase={overlayPhase === 'loading' ? 'loading' : 'success'}
        loadingTitle="Publishing…"
        loadingMessage="Saving your announcement and making it live."
        successTitle="Announcement published!"
        successMessage="Your announcement is now live."
        primaryAction={{ label: 'View Post', onPress: handleViewAnnouncementAfterPublish }}
        secondaryAction={{ label: 'Done', onPress: handleDoneAfterSuccess }}
      />
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
