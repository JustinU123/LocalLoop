import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { ProductItemPreviewCard } from '@/components/business/product-item-preview-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessProductItemGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { publishMenuItem, updateOwnerMenuItem } from '@/services/menuItems';
import type { ProductItemDraft } from '@/types/product-item-draft';
import {
  clearProductItemDraft,
  getMenuItemEditSession,
  getProductItemDraft,
} from '@/utils/product-item-form';

type PublishOverlayPhase = 'idle' | 'loading' | 'success';

export default function BusinessProductItemPreviewScreen() {
  useVerifiedBusinessProductItemGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { businessApplication } = useAccountMode();
  const [draft, setDraft] = useState<ProductItemDraft | null>(() => getProductItemDraft());
  const [isPublishing, setIsPublishing] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<PublishOverlayPhase>('idle');
  const publishInFlightRef = useRef(false);
  const editSession = getMenuItemEditSession();
  const isEditing = Boolean(editSession?.menuItemId);
  const overlayActive = overlayPhase !== 'idle';

  useEffect(() => {
    if (overlayPhase !== 'idle' || draft) {
      return;
    }

    const session = getMenuItemEditSession();
    if (session?.menuItemId) {
      router.replace({
        pathname: '/business-create-product-item',
        params: { editId: session.menuItemId },
      });
      return;
    }

    router.replace('/business-create-product-item');
  }, [draft, overlayPhase]);

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';

  const handleDoneAfterSuccess = () => {
    router.replace(isEditing ? '/business-manage-menu' : '/(business-tabs)/create');
  };

  const handleManageMenuAfterPublish = () => {
    router.replace('/business-manage-menu');
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
        ? await updateOwnerMenuItem(editSession!.menuItemId, draft)
        : await publishMenuItem(draft);

      if (!result.ok) {
        setOverlayPhase('idle');
        Alert.alert(isEditing ? 'Unable to save changes' : 'Unable to publish', result.message);
        return;
      }

      clearProductItemDraft();
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
        <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Item Preview'} />
      </SafeAreaView>
    );
  }

  if (!draft && overlayPhase === 'idle') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Item Preview'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={isEditing ? 'Review Changes' : 'Item Preview'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEnabled={!overlayActive}>
        <Text style={styles.intro}>
          {isEditing
            ? 'Review your updates before saving. Your public profile refreshes on the next load.'
            : 'Preview how this item may appear on your business profile. Nothing is published until you confirm.'}
        </Text>

        <ProductItemPreviewCard draft={draft!} businessName={businessName} verified />

        <View style={styles.actions}>
          <PrimaryButton
            label={isEditing ? 'Save Changes' : 'Publish Item'}
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
        loadingMessage={
          isEditing ? 'Updating your menu item.' : 'Adding your item to the menu.'
        }
        successTitle={isEditing ? 'Item updated!' : 'Item added!'}
        successMessage={
          isEditing
            ? 'Your changes have been saved.'
            : 'Your item has been added to your menu.'
        }
        primaryAction={
          isEditing
            ? { label: 'Done', onPress: handleDoneAfterSuccess }
            : { label: 'Manage Menu', onPress: handleManageMenuAfterPublish }
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
