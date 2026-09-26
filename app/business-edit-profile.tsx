import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { FormField } from '@/components/account/form-field';
import { PrimaryButton } from '@/components/account/primary-button';
import { SectionHeader } from '@/components/account/section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanManageVerifiedBusinessProfile,
  useVerifiedBusinessCreateGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { updateVerifiedBusinessProfile } from '@/services/businessProfile';
import type { BusinessProfileForm, BusinessProfileFormErrors } from '@/types/business-profile-form';
import { businessRowToProfileForm, validateBusinessProfileForm } from '@/utils/business-profile-form';
import { getBusinessInitials } from '@/utils/business-initials';

export default function BusinessEditProfileScreen() {
  useVerifiedBusinessCreateGuard({
    requireBusinessMode: false,
    blockedTitle: 'Business profile unavailable',
    blockedMessage: 'Verify your business before editing your public profile.',
  });
  const canEdit = useCanManageVerifiedBusinessProfile();
  const styles = useThemedStyles(createStyles);
  const { businessRecord, verificationStatus, refreshAccountMode, isReady } = useAccountMode();
  const initialForm = useMemo(() => {
    if (!businessRecord) {
      return null;
    }
    return businessRowToProfileForm(businessRecord);
  }, [businessRecord]);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) {
        return;
      }

      if (verificationStatus !== 'verified' || !businessRecord) {
        Alert.alert(
          'Business profile unavailable',
          'Verify your business before editing your public profile.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    }, [isReady, verificationStatus, businessRecord]),
  );

  if (!isReady || !initialForm || !businessRecord || !canEdit || verificationStatus !== 'verified') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Edit Business Profile" />
        <View style={styles.loadingState}>
          <ActivityIndicator color={styles.loadingIndicator.color} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Edit Business Profile" />
      <BusinessEditProfileForm
        key={businessRecord.id}
        initialForm={initialForm}
        businessRecord={businessRecord}
        refreshAccountMode={refreshAccountMode}
        styles={styles}
      />
    </SafeAreaView>
  );
}

type BusinessEditProfileFormProps = {
  initialForm: BusinessProfileForm;
  businessRecord: NonNullable<ReturnType<typeof useAccountMode>['businessRecord']>;
  refreshAccountMode: () => Promise<void>;
  styles: ReturnType<typeof createStyles>;
};

function BusinessEditProfileForm({
  initialForm,
  businessRecord,
  refreshAccountMode,
  styles,
}: BusinessEditProfileFormProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<BusinessProfileFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveOverlayPhase, setSaveOverlayPhase] = useState<'idle' | 'loading' | 'success'>('idle');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const saveInFlightRef = useRef(false);
  const sourceRowRef = useRef(businessRecord);

  const updateField = <K extends keyof BusinessProfileForm>(key: K, value: BusinessProfileForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
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
    if (!sourceRowRef.current || saveInFlightRef.current || isSaving) {
      return;
    }

    const validation = validateBusinessProfileForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      Alert.alert('Check your profile', validation.message ?? 'Complete all required fields.');
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveOverlayPhase('loading');

    try {
      const result = await updateVerifiedBusinessProfile(form, sourceRowRef.current);

      if (!result.ok) {
        setSaveOverlayPhase('idle');
        Alert.alert('Unable to save', result.message);
        return;
      }

      await refreshAccountMode();
      sourceRowRef.current = result.business;
      setForm(businessRowToProfileForm(result.business));

      let message = 'Your business information has been saved.';
      if (result.geocoded) {
        message += ' Your address was geocoded and map coordinates were saved.';
      } else if (result.coordinatesCleared) {
        message +=
          ' Your address was saved, but map coordinates could not be resolved on this device. Distance and map placement may be unavailable until coordinates are added.';
      }

      setSaveSuccessMessage(message);
      setSaveOverlayPhase('success');
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const overlayActive = saveOverlayPhase !== 'idle';

  return (
    <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!overlayActive}>
          <SectionHeader
            label="Business identity"
            hint="This information appears on your public business profile."
          />

          <View style={styles.logoCard}>
            <View style={styles.logoAvatar}>
              <Text style={styles.logoAvatarText}>{getBusinessInitials(form.name || 'Business')}</Text>
            </View>
            <View style={styles.logoTextBlock}>
              <Text style={styles.logoTitle}>Profile image</Text>
              <Text style={styles.logoHint}>
                Logo and cover photo uploads are coming soon. You can update them from Business
                Settings when branding tools are available.
              </Text>
            </View>
          </View>

          <FormField
            label="Business name"
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
            error={errors.name}
          />
          <FormField
            label="Business category"
            value={form.category}
            onChangeText={(value) => updateField('category', value)}
            placeholder="Coffee shop, bakery, florist, etc."
            error={errors.category}
          />
          <FormField
            label="Business description"
            value={form.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="What makes your business special?"
            multiline
            error={errors.description}
          />

          <SectionHeader
            label="Business location"
            hint="Updating your address clears old map coordinates and geocodes the new address when possible."
          />

          <FormField
            label="Street address"
            value={form.streetAddress}
            onChangeText={(value) => updateField('streetAddress', value)}
            placeholder="3922 W Sunset Blvd"
            error={errors.streetAddress}
          />
          <FormField
            label="City"
            value={form.city}
            onChangeText={(value) => updateField('city', value)}
            placeholder="Los Angeles"
            error={errors.city}
          />
          <FormField
            label="State"
            value={form.state}
            onChangeText={(value) => updateField('state', value)}
            placeholder="CA"
            autoCapitalize="characters"
            error={errors.state}
          />
          <FormField
            label="ZIP code"
            value={form.postalCode}
            onChangeText={(value) => updateField('postalCode', value)}
            placeholder="90026"
            keyboardType="number-pad"
            error={errors.postalCode}
          />

          <SectionHeader
            label="Business details"
            hint="Contact details shown on your public profile when available."
          />

          <FormField
            label="Business phone"
            value={form.phone}
            onChangeText={(value) => updateField('phone', value)}
            placeholder="(323) 555-0199"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <FormField
            label="Public business email"
            value={form.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="hello@business.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <FormField
            label="Website"
            value={form.website}
            onChangeText={(value) => updateField('website', value)}
            placeholder="https://"
            autoCapitalize="none"
            error={errors.website}
          />
          <FormField
            label="Instagram"
            value={form.instagram}
            onChangeText={(value) => updateField('instagram', value)}
            placeholder="@yourbusiness"
            autoCapitalize="none"
            error={errors.instagram}
          />

          <PrimaryButton
            label="Save Changes"
            onPress={handleSave}
            loading={isSaving && saveOverlayPhase === 'loading'}
            disabled={overlayActive}
          />

          <Pressable onPress={() => router.back()} style={styles.cancelButton} disabled={overlayActive}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
        <BusinessSuccessOverlay
          visible={overlayActive}
          phase={saveOverlayPhase === 'loading' ? 'loading' : 'success'}
          loadingTitle="Saving…"
          loadingMessage="Updating your business profile."
          successTitle="Profile updated!"
          successMessage={saveSuccessMessage}
          primaryAction={{
            label: 'Done',
            onPress: () => {
              setSaveOverlayPhase('idle');
              router.back();
            },
          }}
        />
      </KeyboardAvoidingView>
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
    },
    loadingIndicator: {
      color: theme.emerald,
    },
    logoCard: {
      flexDirection: 'row',
      gap: 14,
      alignItems: 'flex-start',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      padding: 14,
    },
    logoAvatar: {
      width: 56,
      height: 56,
      borderRadius: BrandRadius.sm,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoAvatarText: {
      color: theme.emerald,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
    },
    logoTextBlock: {
      flex: 1,
      gap: 4,
    },
    logoTitle: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    logoHint: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    cancelButtonText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
