import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { EventPreviewCard } from '@/components/business/event-preview-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessEventGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { publishEvent, updateOwnerEvent } from '@/services/events';
import type { EventDraft } from '@/types/event-draft';
import {
  clearEventDraft,
  getBusinessAddressLabel,
  getEventDraft,
  getEventEditSession,
} from '@/utils/event-form';
import { openBusinessProfile } from '@/utils/open-business-profile';

type PublishOverlayPhase = 'idle' | 'loading' | 'success';

export default function BusinessEventPreviewScreen() {
  useVerifiedBusinessEventGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { businessApplication, businessRecord } = useAccountMode();
  const [draft, setDraft] = useState<EventDraft | null>(() => getEventDraft());
  const [isPublishing, setIsPublishing] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<PublishOverlayPhase>('idle');
  const [publishedBusinessId, setPublishedBusinessId] = useState<string | null>(null);
  const publishInFlightRef = useRef(false);
  const editSession = getEventEditSession();
  const isEditing = Boolean(editSession?.eventId);
  const overlayActive = overlayPhase !== 'idle';

  useEffect(() => {
    if (overlayPhase !== 'idle' || draft) {
      return;
    }

    const session = getEventEditSession();
    if (session?.eventId) {
      router.replace({
        pathname: '/business-create-event',
        params: { editId: session.eventId },
      });
      return;
    }

    router.replace('/business-create-event');
  }, [draft, overlayPhase]);

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';
  const businessAddress = getBusinessAddressLabel(businessApplication);

  const handleDoneAfterSuccess = () => {
    router.replace('/business-manage-events');
  };

  const handleViewEventAfterPublish = () => {
    const businessId = publishedBusinessId ?? businessRecord?.id?.trim();
    if (!businessId) {
      handleDoneAfterSuccess();
      return;
    }

    router.replace('/business-manage-events');
    openBusinessProfile(businessId, {
      tab: 'events',
      source: 'event-publish',
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
      const result = isEditing
        ? await updateOwnerEvent(editSession!.eventId, draft)
        : await publishEvent(draft);

      if (!result.ok) {
        setOverlayPhase('idle');
        Alert.alert(isEditing ? 'Unable to save changes' : 'Unable to publish', result.message);
        return;
      }

      clearEventDraft();
      setPublishedBusinessId(result.event.businessId);
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
        <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Event Preview'} />
      </SafeAreaView>
    );
  }

  if (!draft && overlayPhase === 'idle') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Event Preview'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Event Preview'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEnabled={!overlayActive}>
        <Text style={styles.intro}>
          {isEditing
            ? 'Review your updates before saving. Your public profile refreshes on the next load.'
            : 'Preview how this event may appear to LocalLoop customers. Nothing is published until you confirm.'}
        </Text>

        <EventPreviewCard
          draft={draft!}
          businessName={businessName}
          businessAddress={businessAddress}
          verified
        />

        <View style={styles.actions}>
          <PrimaryButton
            label={isEditing ? 'Save Changes' : 'Publish Event'}
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
        loadingTitle={isEditing ? 'Saving…' : 'Publishing…'}
        loadingMessage={isEditing ? 'Updating your event.' : 'Saving your event and making it live.'}
        successTitle={isEditing ? 'Event updated!' : 'Event published!'}
        successMessage={isEditing ? 'Your changes have been saved.' : 'Your event is now live.'}
        primaryAction={
          isEditing
            ? { label: 'Done', onPress: handleDoneAfterSuccess }
            : { label: 'View Event', onPress: handleViewEventAfterPublish }
        }
        secondaryAction={isEditing ? undefined : { label: 'Done', onPress: handleDoneAfterSuccess }}
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
