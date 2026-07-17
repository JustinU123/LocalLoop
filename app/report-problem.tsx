import * as Haptics from 'expo-haptics';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { FormField } from '@/components/account/form-field';
import { PrimaryButton } from '@/components/account/primary-button';
import { SectionHeader } from '@/components/account/section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { REPORT_CATEGORIES, type ReportCategory } from '@/constants/report-problem';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatAppInfoBlock } from '@/utils/app-info';
import { openSupportEmail } from '@/utils/support-email';

export default function ReportProblemScreen() {
  const styles = useThemedStyles(createStyles);
  const pathname = usePathname();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [includeAppInfo, setIncludeAppInfo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category || !subject.trim() || !description.trim()) {
      Alert.alert('Missing information', 'Please choose a category and complete the subject and description.');
      return;
    }

    setSubmitting(true);

    const body = [
      `Category: ${category}`,
      '',
      description.trim(),
      '',
      contactEmail.trim() ? `Contact email: ${contactEmail.trim()}` : 'Contact email: Not provided',
      '',
      includeAppInfo ? formatAppInfoBlock(pathname) : 'App information: Not included',
    ].join('\n');

    try {
      await openSupportEmail({
        subject: `[LocalLoop Report] ${subject.trim()}`,
        body,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Report a Problem" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <SectionHeader
            label="Tell us what happened"
            hint="Please do not include passwords, payment information, or other sensitive personal information."
          />

          <Text style={styles.fieldLabel}>Problem category</Text>
          <View style={styles.chipRow}>
            {REPORT_CATEGORIES.map((option) => {
              const selected = category === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(option);
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.chipPressed,
                  ]}>
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <FormField
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of the issue"
          />
          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened and how we can reproduce it"
            multiline
          />
          <FormField
            label="Contact email (optional)"
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Include app information</Text>
              <Text style={styles.toggleHint}>Version, platform, OS, and current screen</Text>
            </View>
            <Switch
              value={includeAppInfo}
              onValueChange={setIncludeAppInfo}
              trackColor={{ false: styles.switchTrackOff.color, true: styles.switchTrackOn.color }}
              thumbColor={styles.switchThumb.color}
            />
          </View>

          <PrimaryButton label="Submit Report" onPress={handleSubmit} loading={submitting} />
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
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.lg,
      padding: 14,
      ...theme.shadowCard,
    },
    toggleText: {
      flex: 1,
      gap: 4,
    },
    toggleLabel: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    toggleHint: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    switchTrackOff: {
      color: theme.border,
    },
    switchTrackOn: {
      color: theme.emerald,
    },
    switchThumb: {
      color: theme.surface,
    },
  });
}
