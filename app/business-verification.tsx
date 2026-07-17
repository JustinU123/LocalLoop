import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
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
import { CheckboxRow } from '@/components/account/checkbox-row';
import { FormField } from '@/components/account/form-field';
import { PrimaryButton } from '@/components/account/primary-button';
import { SectionHeader } from '@/components/account/section-header';
import { VerificationUploadPlaceholder } from '@/components/account/verification-upload-placeholder';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import {
  EMPTY_BUSINESS_APPLICATION,
  VERIFICATION_METHOD_OPTIONS,
  validateBusinessApplication,
} from '@/constants/business-verification';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { VerificationMethod } from '@/types/account-mode';

export default function BusinessVerificationScreen() {
  const styles = useThemedStyles(createStyles);
  const { businessApplication, submitBusinessApplication } = useAccountMode();

  const initialValues = useMemo(() => {
    if (!businessApplication) {
      return EMPTY_BUSINESS_APPLICATION;
    }

    const { submittedAt: _submittedAt, ...rest } = businessApplication;
    return rest;
  }, [businessApplication]);

  const [form, setForm] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    const validationError = validateBusinessApplication(form);
    if (validationError) {
      Alert.alert('Missing information', validationError);
      return;
    }

    setSubmitting(true);
    try {
      const submitted = await submitBusinessApplication(form);
      if (submitted) {
        router.replace('/business-verification-pending');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Business Verification" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <SectionHeader
            label="Business details"
            hint="Tell us about the independent business you want to manage on LocalLoop."
          />

          <FormField
            label="Business name"
            value={form.businessName}
            onChangeText={(value) => updateField('businessName', value)}
            placeholder="Casa Luna Tacos"
          />
          <FormField
            label="Business category"
            value={form.category}
            onChangeText={(value) => updateField('category', value)}
            placeholder="Coffee shop, bakery, florist, etc."
          />
          <FormField
            label="Business description"
            value={form.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="What makes this business special?"
            multiline
          />
          <FormField
            label="Business address or service area"
            value={form.addressOrServiceArea}
            onChangeText={(value) => updateField('addressOrServiceArea', value)}
            placeholder="123 Main Street or Echo Park delivery area"
          />
          <FormField
            label="City"
            value={form.city}
            onChangeText={(value) => updateField('city', value)}
            placeholder="Los Angeles"
          />
          <FormField
            label="State"
            value={form.state}
            onChangeText={(value) => updateField('state', value)}
            placeholder="CA"
            autoCapitalize="characters"
          />
          <FormField
            label="ZIP code"
            value={form.zipCode}
            onChangeText={(value) => updateField('zipCode', value)}
            placeholder="90026"
            keyboardType="number-pad"
          />
          <FormField
            label="Business phone"
            value={form.businessPhone}
            onChangeText={(value) => updateField('businessPhone', value)}
            placeholder="(323) 555-0199"
            keyboardType="phone-pad"
          />
          <FormField
            label="Public business email"
            value={form.publicBusinessEmail}
            onChangeText={(value) => updateField('publicBusinessEmail', value)}
            placeholder="hello@business.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <SectionHeader
            label="Online presence"
            hint="Optional links that help us confirm your business."
          />

          <FormField
            label="Instagram"
            value={form.instagram}
            onChangeText={(value) => updateField('instagram', value)}
            placeholder="@yourbusiness"
            autoCapitalize="none"
          />
          <FormField
            label="Website"
            value={form.website}
            onChangeText={(value) => updateField('website', value)}
            placeholder="https://"
            autoCapitalize="none"
          />
          <FormField
            label="Google Business listing"
            value={form.googleBusinessListing}
            onChangeText={(value) => updateField('googleBusinessListing', value)}
            placeholder="Google Maps or Business Profile link"
            autoCapitalize="none"
          />
          <FormField
            label="Yelp page"
            value={form.yelpPage}
            onChangeText={(value) => updateField('yelpPage', value)}
            placeholder="Yelp business URL"
            autoCapitalize="none"
          />
          <FormField
            label="Other social profile"
            value={form.otherSocialProfile}
            onChangeText={(value) => updateField('otherSocialProfile', value)}
            placeholder="TikTok, Facebook, or other profile"
            autoCapitalize="none"
          />

          <SectionHeader
            label="Proof of ownership or management"
            hint="To protect businesses and customers, LocalLoop reviews business access requests before enabling business tools."
          />

          <Text style={styles.fieldLabel}>Verification method</Text>
          <View style={styles.chipRow}>
            {VERIFICATION_METHOD_OPTIONS.map((option) => {
              const selected = form.verificationMethod === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateField('verificationMethod', option.id as VerificationMethod);
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.chipPressed,
                  ]}>
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <VerificationUploadPlaceholder />

          <FormField
            label="Describe the proof you can provide"
            value={form.verificationExplanation}
            onChangeText={(value) => updateField('verificationExplanation', value)}
            placeholder="Example: I can verify using our hello@business.com inbox and storefront photos."
            multiline
          />

          <Text style={styles.safetyNote}>
            LocalLoop does not request tax identification numbers or Social Security numbers.
          </Text>

          <CheckboxRow
            label="I confirm that I own this business or am authorized to manage it."
            checked={form.ownershipConfirmed}
            onToggle={() => updateField('ownershipConfirmed', !form.ownershipConfirmed)}
          />

          <PrimaryButton label="Submit for Review" onPress={handleSubmit} loading={submitting} />
        </ScrollView>
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
      paddingBottom: 40,
      gap: 16,
    },
    fieldLabel: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
      marginBottom: -8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    chipPressed: {
      opacity: 0.92,
    },
    chipLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    chipLabelSelected: {
      color: theme.emerald,
    },
    safetyNote: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: BrandFonts.regular,
    },
  });
}
