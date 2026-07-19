import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { DateFormField } from '@/components/business/date-form-field';
import { FormFieldWithCounter } from '@/components/business/form-field-with-counter';
import { PromotionImageField } from '@/components/business/promotion-image-field';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { PROMOTION_FIELD_LIMITS } from '@/constants/promotion-create';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessPromotionGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { PromotionDraft } from '@/types/promotion-draft';
import {
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
  const navigation = useNavigation();
  const [form, setForm] = useState<PromotionDraft>(
    () => getPromotionDraft() ?? createEmptyPromotionDraft(),
  );

  const { valid, errors } = useMemo(() => validatePromotionForm(form), [form]);
  const isDirty = useMemo(() => !isPromotionFormEmpty(form), [form]);

  const updateField = <K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const attemptBack = useCallback(() => {
    if (!isDirty) {
      router.back();
      return;
    }

    Alert.alert('Discard this promotion?', undefined, [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          clearPromotionDraft();
          router.back();
        },
      },
    ]);
  }, [isDirty]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      Alert.alert('Discard this promotion?', undefined, [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            clearPromotionDraft();
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, isDirty]);

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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}>
          <Text style={styles.intro}>
            Create a limited-time offer for nearby LocalLoop customers. Publishing will be connected
            in a future update.
          </Text>

          <PromotionImageField
            imageUri={form.imageUri}
            onChange={(uri) => updateField('imageUri', uri)}
          />

          <FormFieldWithCounter
            label="Promotion Title"
            value={form.title}
            maxLength={PROMOTION_FIELD_LIMITS.title}
            onChangeText={(value) => updateField('title', value)}
            placeholder="Buy One, Get One Free"
            error={errors.title}
          />

          <FormFieldWithCounter
            label="Description"
            value={form.description}
            maxLength={PROMOTION_FIELD_LIMITS.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Purchase any large drink and receive a second drink free."
            multiline
            error={errors.description}
          />

          <DateFormField
            label="Start Date"
            value={form.startDate}
            onChange={(value) => updateField('startDate', value)}
            error={errors.startDate}
          />

          <DateFormField
            label="End Date"
            value={form.endDate}
            onChange={(value) => updateField('endDate', value)}
            error={errors.endDate}
          />

          <FormFieldWithCounter
            label="Promotion Code"
            value={form.promotionCode}
            maxLength={PROMOTION_FIELD_LIMITS.promotionCode}
            onChangeText={(value) => updateField('promotionCode', value.toUpperCase())}
            placeholder="LOCAL20"
            autoCapitalize="characters"
            helperText="Leave blank if no code is required."
            error={errors.promotionCode}
          />

          <FormFieldWithCounter
            label="Redemption Instructions"
            value={form.redemptionInstructions}
            maxLength={PROMOTION_FIELD_LIMITS.redemptionInstructions}
            onChangeText={(value) => updateField('redemptionInstructions', value)}
            placeholder="Show this promotion to the cashier before checkout."
            multiline
            error={errors.redemptionInstructions}
          />

          <FormFieldWithCounter
            label="Terms and Conditions"
            value={form.termsAndConditions}
            maxLength={PROMOTION_FIELD_LIMITS.termsAndConditions}
            onChangeText={(value) => updateField('termsAndConditions', value)}
            placeholder="Limit one per customer. Cannot be combined with other offers."
            multiline
            error={errors.termsAndConditions}
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Continue" onPress={handleContinue} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>
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
    content: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 16,
    },
    intro: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
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
