import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { PromotionFormFields } from '@/components/business/promotion-form-fields';
import { UnsavedChangesDiscardModal } from '@/components/business/unsaved-changes-discard-modal';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessPromotionGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getOwnerPromotionById } from '@/services/promotions';
import type { PromotionDraft } from '@/types/promotion-draft';
import {
  beginPromotionEdit,
  clearPromotionDraft,
  createEmptyPromotionDraft,
  getPromotionDraft,
  getPromotionEditSession,
  isPromotionFormEmpty,
  setPromotionDraft,
  validatePromotionForm,
} from '@/utils/promotion-form';

export default function BusinessEditPromotionScreen() {
  useVerifiedBusinessPromotionGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const promotionId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionDraft>(() => getPromotionDraft() ?? createEmptyPromotionDraft());
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPromotion() {
      if (!promotionId) {
        setLoadError('Promotion not found.');
        setLoading(false);
        return;
      }

      const session = getPromotionEditSession();
      if (session?.promotionId === promotionId && getPromotionDraft()) {
        const draft = getPromotionDraft()!;
        if (!cancelled) {
          setForm(draft);
          setInitialSnapshot(JSON.stringify(draft));
          setLoading(false);
        }
        return;
      }

      const result = await getOwnerPromotionById(promotionId);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setLoadError(result.message);
        setLoading(false);
        return;
      }

      if (result.promotion.lifecycle === 'ended') {
        setLoadError('Ended promotions cannot be edited.');
        setLoading(false);
        return;
      }

      beginPromotionEdit(result.promotion.id, result.promotion.draft, result.promotion.imageUrl);
      setForm(result.promotion.draft);
      setInitialSnapshot(JSON.stringify(result.promotion.draft));
      setLoading(false);
    }

    void loadPromotion();

    return () => {
      cancelled = true;
    };
  }, [promotionId]);

  const { valid, errors } = useMemo(() => validatePromotionForm(form), [form]);
  const isDirty = useMemo(() => {
    if (!initialSnapshot) {
      return !isPromotionFormEmpty(form);
    }
    return JSON.stringify(form) !== initialSnapshot;
  }, [form, initialSnapshot]);

  const { attemptBack, discardModalProps } = useUnsavedChangesGuard({
    isDirty,
    title: 'Discard your changes?',
    onDiscard: clearPromotionDraft,
    onLeaveWithoutSaving: clearPromotionDraft,
  });

  const updateField = <K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleContinue = () => {
    if (!valid || !canCreate || !promotionId) {
      return;
    }

    setPromotionDraft(form);
    router.push('/business-promotion-preview');
  };

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Edit Promotion" onBackPress={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Edit Promotion" onBackPress={attemptBack} />
        <UnsavedChangesDiscardModal {...discardModalProps} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Edit Promotion" onBackPress={attemptBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.emerald} />
          </View>
        ) : (
          <PromotionFormFields
            form={form}
            errors={errors}
            intro="Update your promotion details. Changes apply to the same promotion—nothing new is created."
            onChange={updateField}
          />
        )}

        <View style={styles.footer}>
          <PrimaryButton
            label="Review Changes"
            onPress={handleContinue}
            disabled={!valid || loading || Boolean(loadError)}
          />
        </View>
      </KeyboardAvoidingView>
      <UnsavedChangesDiscardModal {...discardModalProps} />
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    flex: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      backgroundColor: theme.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    errorText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
