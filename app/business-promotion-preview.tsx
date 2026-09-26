import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { PromotionPreviewCard } from '@/components/business/promotion-preview-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessPromotionGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { publishPromotion, updateOwnerPromotion } from '@/services/promotions';
import { getOwnerPromotionLifecycle } from '@/utils/promotion-owner';
import type { PromotionDraft } from '@/types/promotion-draft';
import {
  clearPromotionDraft,
  getPromotionDraft,
  getPromotionEditSession,
  getPromotionStartDateTime,
} from '@/utils/promotion-form';
import { openBusinessProfile } from '@/utils/open-business-profile';

type PublishOverlayPhase = 'idle' | 'loading' | 'success';

export default function BusinessPromotionPreviewScreen() {
  useVerifiedBusinessPromotionGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { businessApplication, businessRecord } = useAccountMode();
  const [draft, setDraft] = useState<PromotionDraft | null>(() => getPromotionDraft());
  const [isPublishing, setIsPublishing] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<PublishOverlayPhase>('idle');
  const [publishedBusinessId, setPublishedBusinessId] = useState<string | null>(null);
  const [publishScheduledMessaging, setPublishScheduledMessaging] = useState(false);
  const publishInFlightRef = useRef(false);

  const overlayActive = overlayPhase !== 'idle';

  useEffect(() => {
    if (overlayPhase !== 'idle' || draft) {
      return;
    }

    const session = getPromotionEditSession();
    if (session?.promotionId) {
      router.replace({
        pathname: '/business-edit-promotion',
        params: { id: session.promotionId },
      });
      return;
    }

    router.replace('/business-create-promotion');
  }, [draft, overlayPhase]);

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';

  const editSession = getPromotionEditSession();
  const isEditing = Boolean(editSession?.promotionId);

  const handleDoneAfterSuccess = () => {
    if (isEditing) {
      router.replace('/business-manage-promotions');
      return;
    }
    router.replace('/(business-tabs)/create');
  };

  const handleViewPromotionAfterPublish = () => {
    const businessId = publishedBusinessId ?? businessRecord?.id?.trim();
    if (!businessId) {
      handleDoneAfterSuccess();
      return;
    }

    router.replace('/(business-tabs)/create');
    openBusinessProfile(businessId, {
      tab: 'promotions',
      source: 'promotion-publish',
    });
  };

  const handlePublish = async () => {
    if (!draft || publishInFlightRef.current || isPublishing) {
      return;
    }

    publishInFlightRef.current = true;
    setIsPublishing(true);
    if (!isEditing) {
      const start = getPromotionStartDateTime(draft);
      setPublishScheduledMessaging(Boolean(start && start.getTime() > Date.now()));
    } else {
      setPublishScheduledMessaging(false);
    }
    setOverlayPhase('loading');

    try {
      const result = isEditing
        ? await updateOwnerPromotion(editSession!.promotionId, draft)
        : await publishPromotion(draft);

      if (!result.ok) {
        setOverlayPhase('idle');
        Alert.alert(isEditing ? 'Unable to save changes' : 'Unable to publish', result.message);
        return;
      }

      clearPromotionDraft();
      setPublishedBusinessId(result.promotion.businessId);
      if (!isEditing) {
        setPublishScheduledMessaging(
          getOwnerPromotionLifecycle(
            {
              status: result.promotion.status,
              start_at: result.promotion.startAt,
              end_at: result.promotion.endAt,
            },
            new Date(),
          ) === 'scheduled',
        );
      }

      if (__DEV__) {
        console.info('[business-promotion-preview] saved', {
          promotionId: result.promotion.id,
          businessId: result.promotion.businessId,
          imageUrl: result.promotion.imageUrl,
          mode: isEditing ? 'edit' : 'publish',
        });
      }

      setOverlayPhase('success');
    } finally {
      publishInFlightRef.current = false;
      setIsPublishing(false);
    }
  };

  const handleBackToEdit = () => {
    router.back();
  };

  const handleCancel = () => {
    if (overlayActive) {
      return;
    }
    clearPromotionDraft();
    if (isEditing) {
      router.replace('/business-manage-promotions');
      return;
    }
    router.replace('/(business-tabs)/create');
  };

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Promotion Preview'} />
      </SafeAreaView>
    );
  }

  if (!draft && overlayPhase === 'idle') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Promotion Preview'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Promotion Preview'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEnabled={!overlayActive}>
        <Text style={styles.intro}>
          {isEditing
            ? 'Review your updates before saving. Consumer surfaces refresh on their next load.'
            : 'Preview how this promotion may appear to LocalLoop customers. Nothing is published until you confirm below.'}
        </Text>

        <PromotionPreviewCard draft={draft!} businessName={businessName} verified />

        <View style={styles.actions}>
          <PrimaryButton
            label={isEditing ? 'Save Changes' : 'Publish Promotion'}
            onPress={handlePublish}
            loading={isPublishing && overlayPhase === 'loading'}
            disabled={overlayActive}
          />
          <Pressable
            onPress={handleBackToEdit}
            style={styles.secondaryButton}
            disabled={overlayActive}>
            <Text style={styles.secondaryButtonText}>Back to Edit</Text>
          </Pressable>
          <Pressable onPress={handleCancel} style={styles.cancelButton} disabled={overlayActive}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BusinessSuccessOverlay
        visible={overlayActive}
        phase={overlayPhase === 'loading' ? 'loading' : 'success'}
        loadingTitle={isEditing ? 'Saving…' : 'Publishing…'}
        loadingMessage={
          isEditing
            ? 'Updating your promotion.'
            : publishScheduledMessaging
              ? 'Saving your promotion and scheduling it to go live.'
              : 'Saving your promotion and making it live.'
        }
        successTitle={
          isEditing
            ? 'Promotion updated!'
            : publishScheduledMessaging
              ? 'Promotion scheduled!'
              : 'Promotion published!'
        }
        successMessage={
          isEditing
            ? 'Your changes have been saved.'
            : publishScheduledMessaging
              ? 'Your promotion is scheduled and ready to go live.'
              : 'Your promotion is now live.'
        }
        primaryAction={
          isEditing
            ? { label: 'Done', onPress: handleDoneAfterSuccess }
            : { label: 'View Promotion', onPress: handleViewPromotionAfterPublish }
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
