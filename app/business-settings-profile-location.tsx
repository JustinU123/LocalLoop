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
import type { BusinessRow } from '@/types/supabase-business';
import { mergeProfileFormPatch, validateLocationSection } from '@/utils/business-profile-form';

type LocationFormProps = {
  initialForm: BusinessProfileForm;
  sourceRowRef: MutableRefObject<BusinessRow | null>;
  persistProfileSection: ReturnType<
    typeof useVerifiedBusinessProfileEditor
  >['persistProfileSection'];
  isSaving: boolean;
  styles: ReturnType<typeof createStyles>;
};

function LocationForm({
  initialForm,
  sourceRowRef,
  persistProfileSection,
  isSaving,
  styles,
}: LocationFormProps) {
  const [streetAddress, setStreetAddress] = useState(initialForm.streetAddress);
  const [city, setCity] = useState(initialForm.city);
  const [stateValue, setStateValue] = useState(initialForm.state);
  const [postalCode, setPostalCode] = useState(initialForm.postalCode);
  const [errors, setErrors] = useState<BusinessProfileFormErrors>({});

  const sectionFields = useMemo(
    () => ({
      streetAddress,
      city,
      state: stateValue,
      postalCode,
    }),
    [streetAddress, city, stateValue, postalCode],
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
    const validation = validateLocationSection(sectionFields);
    setErrors(validation.errors);

    const row = sourceRowRef.current;
    if (!row) {
      return;
    }

    await persistProfileSection({
      mergedForm: mergeProfileFormPatch(row, sectionFields),
      sectionValidation: validation,
      successTitle: 'Location saved!',
      successMessage: 'Your business location has been updated.',
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
          label="Business location"
          hint="Updating your address clears old map coordinates and geocodes the new address when possible."
        />

        <FormField
          label="Street address"
          value={streetAddress}
          onChangeText={(value) => {
            setStreetAddress(value);
            clearFieldError('streetAddress');
          }}
          placeholder="3922 W Sunset Blvd"
          error={errors.streetAddress}
        />
        <FormField
          label="City"
          value={city}
          onChangeText={(value) => {
            setCity(value);
            clearFieldError('city');
          }}
          placeholder="Los Angeles"
          error={errors.city}
        />
        <FormField
          label="State"
          value={stateValue}
          onChangeText={(value) => {
            setStateValue(value);
            clearFieldError('state');
          }}
          placeholder="CA"
          autoCapitalize="characters"
          error={errors.state}
        />
        <FormField
          label="ZIP code"
          value={postalCode}
          onChangeText={(value) => {
            setPostalCode(value);
            clearFieldError('postalCode');
          }}
          placeholder="90026"
          keyboardType="number-pad"
          error={errors.postalCode}
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

export default function BusinessSettingsProfileLocationScreen() {
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
        <AccountScreenHeader title="Location" onBackPress={() => router.back()} />
        <View style={styles.loadingState}>
          <ActivityIndicator color={styles.loadingIndicator.color} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Location" onBackPress={() => router.back()} />
      <LocationForm
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
        loadingMessage="Updating your business location."
        successTitle={saveSuccessOverlay?.title ?? 'Location saved!'}
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
