import * as Haptics from 'expo-haptics';
import { useState } from 'react';
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
import { FormField } from '@/components/account/form-field';
import { PrimaryButton } from '@/components/account/primary-button';
import { SectionHeader } from '@/components/account/section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { openSupportEmail } from '@/utils/support-email';

type OwnershipChoice = 'yes' | 'no';

export default function RequestBusinessScreen() {
  const styles = useThemedStyles(createStyles);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [reason, setReason] = useState('');
  const [ownership, setOwnership] = useState<OwnershipChoice>('no');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!businessName.trim() || !city.trim() || !reason.trim()) {
      Alert.alert('Missing information', 'Please provide the business name, city, and reason for your recommendation.');
      return;
    }

    setSubmitting(true);

    const body = [
      `Business name: ${businessName.trim()}`,
      `Category: ${category.trim() || 'Not provided'}`,
      `Address or neighborhood: ${address.trim() || 'Not provided'}`,
      `City: ${city.trim()}`,
      `Website or Instagram: ${website.trim() || 'Not provided'}`,
      `Is this your business?: ${ownership === 'yes' ? 'Yes' : 'No'}`,
      '',
      'Why should LocalLoop feature this business?',
      reason.trim(),
    ].join('\n');

    try {
      const opened = await openSupportEmail({
        subject: `[LocalLoop Recommendation] ${businessName.trim()}`,
        body,
      });

      if (opened) {
        Alert.alert(
          'Recommendation sent',
          'Thanks for helping us discover great local businesses. Our team will review your recommendation.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Request a Business" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <SectionHeader
            label="Recommend a local business"
            hint="Know a local business worth discovering? Recommend it to LocalLoop."
          />

          <FormField
            label="Business name"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Casa Luna Tacos"
          />
          <FormField
            label="Business category"
            value={category}
            onChangeText={setCategory}
            placeholder="Coffee shop, bakery, florist, etc."
          />
          <FormField
            label="Address or neighborhood"
            value={address}
            onChangeText={setAddress}
            placeholder="Echo Park, Main Street, etc."
          />
          <FormField
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Los Angeles"
          />
          <FormField
            label="Business website or Instagram (optional)"
            value={website}
            onChangeText={setWebsite}
            placeholder="https:// or @handle"
            autoCapitalize="none"
          />
          <FormField
            label="Why should LocalLoop feature this business?"
            value={reason}
            onChangeText={setReason}
            placeholder="Tell us what makes this business special"
            multiline
          />

          <Text style={styles.fieldLabel}>Is this your business?</Text>
          <View style={styles.choiceRow}>
            {(['yes', 'no'] as OwnershipChoice[]).map((choice) => {
              const selected = ownership === choice;
              return (
                <Pressable
                  key={choice}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setOwnership(choice);
                  }}
                  style={({ pressed }) => [
                    styles.choiceButton,
                    selected && styles.choiceButtonSelected,
                    pressed && styles.choiceButtonPressed,
                  ]}>
                  <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
                    {choice === 'yes' ? 'Yes' : 'No'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton label="Submit Recommendation" onPress={handleSubmit} loading={submitting} />
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
    choiceRow: {
      flexDirection: 'row',
      gap: 10,
    },
    choiceButton: {
      flex: 1,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.md,
      paddingVertical: 12,
    },
    choiceButtonSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    choiceButtonPressed: {
      opacity: 0.92,
    },
    choiceLabel: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    choiceLabelSelected: {
      color: theme.emerald,
    },
  });
}
