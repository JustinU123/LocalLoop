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
import { mergeProfileFormPatch, validateContactLinksSection } from '@/utils/business-profile-form';

type ContactFormProps = {
  initialForm: BusinessProfileForm;
  sourceRowRef: MutableRefObject<BusinessRow | null>;
  persistProfileSection: ReturnType<
    typeof useVerifiedBusinessProfileEditor
  >['persistProfileSection'];
  isSaving: boolean;
  styles: ReturnType<typeof createStyles>;
};

function ContactForm({
  initialForm,
  sourceRowRef,
  persistProfileSection,
  isSaving,
  styles,
}: ContactFormProps) {
  const [phone, setPhone] = useState(initialForm.phone);
  const [email, setEmail] = useState(initialForm.email);
  const [website, setWebsite] = useState(initialForm.website);
  const [instagram, setInstagram] = useState(initialForm.instagram);
  const [errors, setErrors] = useState<BusinessProfileFormErrors>({});

  const sectionFields = useMemo(
    () => ({ phone, email, website, instagram }),
    [phone, email, website, instagram],
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
    const validation = validateContactLinksSection(sectionFields);
    setErrors(validation.errors);

    const row = sourceRowRef.current;
    if (!row) {
      return;
    }

    await persistProfileSection({
      mergedForm: mergeProfileFormPatch(row, sectionFields),
      sectionValidation: validation,
      successTitle: 'Profile updated!',
      successMessage: 'Your contact details have been saved.',
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
          label="Reach customers"
          hint="Contact details shown on your public profile when available."
        />

        <FormField
          label="Business phone"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            clearFieldError('phone');
          }}
          placeholder="(323) 555-0199"
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <FormField
          label="Public business email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            clearFieldError('email');
          }}
          placeholder="hello@business.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <FormField
          label="Website"
          value={website}
          onChangeText={(value) => {
            setWebsite(value);
            clearFieldError('website');
          }}
          placeholder="https://"
          autoCapitalize="none"
          error={errors.website}
        />
        <FormField
          label="Instagram"
          value={instagram}
          onChangeText={(value) => {
            setInstagram(value);
            clearFieldError('instagram');
          }}
          placeholder="@yourbusiness"
          autoCapitalize="none"
          error={errors.instagram}
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

export default function BusinessSettingsProfileContactScreen() {
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
        <AccountScreenHeader title="Contact & Links" onBackPress={() => router.back()} />
        <View style={styles.loadingState}>
          <ActivityIndicator color={styles.loadingIndicator.color} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Contact & Links" onBackPress={() => router.back()} />
      <ContactForm
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
