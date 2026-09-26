import { router } from 'expo-router';
import { useMemo, useState, type MutableRefObject } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { FormField } from '@/components/account/form-field';
import { PrimaryButton } from '@/components/account/primary-button';
import { SectionHeader } from '@/components/account/section-header';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useVerifiedBusinessProfileEditor } from '@/hooks/use-verified-business-profile-editor';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessProfileForm, BusinessProfileFormErrors } from '@/types/business-profile-form';
import {
  mergeProfileFormPatch,
  validateBusinessInformationSection,
} from '@/utils/business-profile-form';
import type { BusinessRow } from '@/types/supabase-business';

type InformationFormProps = {
  initialForm: BusinessProfileForm;
  sourceRowRef: MutableRefObject<BusinessRow | null>;
  persistProfileSection: ReturnType<
    typeof useVerifiedBusinessProfileEditor
  >['persistProfileSection'];
  isSaving: boolean;
  styles: ReturnType<typeof createStyles>;
};

function InformationForm({
  initialForm,
  sourceRowRef,
  persistProfileSection,
  isSaving,
  styles,
}: InformationFormProps) {
  const [name, setName] = useState(initialForm.name);
  const [category, setCategory] = useState(initialForm.category);
  const [description, setDescription] = useState(initialForm.description);
  const [errors, setErrors] = useState<BusinessProfileFormErrors>({});

  const sectionFields = useMemo(
    () => ({ name, category, description }),
    [name, category, description],
  );

  const clearFieldError = (key: keyof BusinessProfileFormErrors) => {
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    const validation = validateBusinessInformationSection(sectionFields);
    setErrors(validation.errors);

    const row = sourceRowRef.current;
    if (!row) {
      return;
    }

    await persistProfileSection({
      mergedForm: mergeProfileFormPatch(row, sectionFields),
      sectionValidation: validation,
      successTitle: 'Profile updated!',
      successMessage: 'Your business information has been saved.',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <SectionHeader
          label="Public details"
          hint="Name, category, and description appear on your business profile."
        />

        <FormField
          label="Business name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            clearFieldError('name');
          }}
          error={errors.name}
        />
        <FormField
          label="Business category"
          value={category}
          onChangeText={(value) => {
            setCategory(value);
            clearFieldError('category');
          }}
          placeholder="Coffee shop, bakery, florist, etc."
          error={errors.category}
        />
        <FormField
          label="Business description"
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            clearFieldError('description');
          }}
          placeholder="What makes your business special?"
          multiline
          error={errors.description}
        />

        <PrimaryButton
          label="Save Changes"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function BusinessSettingsProfileInformationScreen() {
  const styles = useThemedStyles(createStyles);
  const {
    isLoading,
    isSaving,
    sourceRowRef,
    initialForm,
    businessRecord,
    persistProfileSection,
    saveOverlayPhase,
    saveSuccessOverlay,
    dismissSaveSuccessOverlay,
  } = useVerifiedBusinessProfileEditor();

  if (isLoading || !initialForm || !businessRecord) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader
          title="Business Information"
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingState}>
          <ActivityIndicator color={styles.loadingIndicator.color} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Business Information" onBackPress={() => router.back()} />
      <InformationForm
        key={businessRecord.id}
        initialForm={initialForm}
        sourceRowRef={sourceRowRef}
        persistProfileSection={persistProfileSection}
        isSaving={isSaving}
        styles={styles}
      />
      <BusinessSuccessOverlay
        visible={saveOverlayPhase !== 'idle'}
        phase={saveOverlayPhase === 'loading' ? 'loading' : 'success'}
        loadingTitle="Saving…"
        loadingMessage="Updating your business profile."
        successTitle={saveSuccessOverlay?.title ?? 'Profile updated!'}
        successMessage={saveSuccessOverlay?.message ?? ''}
        primaryAction={{ label: 'Done', onPress: dismissSaveSuccessOverlay }}
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
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 16,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    loadingIndicator: {
      color: theme.emerald,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
    },
  });
}
