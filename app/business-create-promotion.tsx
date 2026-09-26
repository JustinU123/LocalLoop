import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { PromotionFormFields } from '@/components/business/promotion-form-fields';
import { UnsavedChangesDiscardModal } from '@/components/business/unsaved-changes-discard-modal';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { type AppThemeTokens } from '@/constants/business-theme';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessPromotionGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { PromotionDraft } from '@/types/promotion-draft';
import {
  clearPromotionEditSession,
  clearPromotionDraft,
  createEmptyPromotionDraft,
  getPromotionDraft,
  isPromotionFormEmpty,
  setPromotionDraft,
  validatePromotionForm,
} from '@/utils/promotion-form';

export default function BusinessCreatePromotionScreen() {
  useVerifiedBusinessPromotionGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const [form, setForm] = useState<PromotionDraft>(
    () => getPromotionDraft() ?? createEmptyPromotionDraft(),
  );

  useEffect(() => {
    clearPromotionEditSession();
  }, []);

  const { valid, errors } = useMemo(() => validatePromotionForm(form), [form]);
  const isDirty = useMemo(() => !isPromotionFormEmpty(form), [form]);

  const { attemptBack, discardModalProps } = useUnsavedChangesGuard({
    isDirty,
    title: 'Discard this promotion?',
    onDiscard: clearPromotionDraft,
  });

  const updateField = <K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleContinue = () => {
    if (!valid || !canCreate) {
      return;
    }

    setPromotionDraft(form);
    router.push('/business-promotion-preview');
  };

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Create Promotion" onBackPress={attemptBack} />
        <UnsavedChangesDiscardModal {...discardModalProps} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Create Promotion" onBackPress={attemptBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <PromotionFormFields
          form={form}
          errors={errors}
          intro="Create a limited-time offer for nearby LocalLoop customers. Review and publish when you are ready."
          onChange={updateField}
        />

        <View style={styles.footer}>
          <PrimaryButton label="Continue" onPress={handleContinue} disabled={!valid} />
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
  });
}
