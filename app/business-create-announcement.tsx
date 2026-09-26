import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { SectionHeader } from '@/components/account/section-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { AnnouncementImageField } from '@/components/business/announcement-image-field';
import { DateFormField } from '@/components/business/date-form-field';
import { FormFieldWithCounter } from '@/components/business/form-field-with-counter';
import { OptionChipGroup } from '@/components/business/option-chip-group';
import { UnsavedChangesDiscardModal } from '@/components/business/unsaved-changes-discard-modal';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import {
  ANNOUNCEMENT_CATEGORY_OPTIONS,
  ANNOUNCEMENT_FIELD_LIMITS,
} from '@/constants/announcement-create';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessAnnouncementGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnnouncementDraft } from '@/types/announcement-draft';
import { parseIsoDate, todayStart } from '@/utils/date-time';
import {
  clearAnnouncementDraft,
  createEmptyAnnouncementDraft,
  getAnnouncementDraft,
  isAnnouncementFormEmpty,
  setAnnouncementDraft,
  validateAnnouncementForm,
} from '@/utils/announcement-form';

export default function BusinessCreateAnnouncementScreen() {
  useVerifiedBusinessAnnouncementGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const [form, setForm] = useState<AnnouncementDraft>(
    () => getAnnouncementDraft() ?? createEmptyAnnouncementDraft(),
  );

  const { valid, errors } = useMemo(() => validateAnnouncementForm(form), [form]);
  const isDirty = useMemo(() => !isAnnouncementFormEmpty(form), [form]);

  const { attemptBack, discardModalProps } = useUnsavedChangesGuard({
    isDirty,
    title: 'Discard this announcement?',
    onDiscard: clearAnnouncementDraft,
  });

  const today = useMemo(() => todayStart(), []);

  const endDateMinimum = useMemo(() => {
    const startDate = parseIsoDate(form.startDate);
    if (startDate && startDate >= today) {
      return startDate;
    }
    return today;
  }, [form.startDate, today]);

  const updateField = <K extends keyof AnnouncementDraft>(key: K, value: AnnouncementDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleExpirationToggle = (enabled: boolean) => {
    setForm((current) => ({
      ...current,
      hasExpiration: enabled,
      startDate: enabled ? current.startDate : null,
      endDate: enabled ? current.endDate : null,
    }));
  };

  const handleContinue = () => {
    if (!valid || !canCreate) {
      return;
    }

    setAnnouncementDraft(form);
    router.push('/business-announcement-preview');
  };

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Create Announcement" onBackPress={attemptBack} />
        <UnsavedChangesDiscardModal {...discardModalProps} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Create Announcement" onBackPress={attemptBack} />
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
            Share business updates with nearby customers. Publishing and notifications will be
            connected in a future update.
          </Text>

          <AnnouncementImageField
            imageUri={form.imageUri}
            onChange={(uri) => updateField('imageUri', uri)}
          />

          <FormFieldWithCounter
            label="Announcement Title"
            value={form.title}
            maxLength={ANNOUNCEMENT_FIELD_LIMITS.title}
            onChangeText={(value) => updateField('title', value)}
            placeholder="We're Closed on July 4"
            error={errors.title}
          />

          <FormFieldWithCounter
            label="Announcement Message"
            value={form.message}
            maxLength={ANNOUNCEMENT_FIELD_LIMITS.message}
            onChangeText={(value) => updateField('message', value)}
            placeholder="We'll be closed on Friday for Independence Day and reopen Saturday morning."
            multiline
            error={errors.message}
          />

          <OptionChipGroup
            label="Announcement Category"
            options={ANNOUNCEMENT_CATEGORY_OPTIONS}
            value={form.category}
            onChange={(value) => updateField('category', value)}
            error={errors.category}
          />

          <SectionHeader label="Visibility" hint="Control how this announcement appears." />

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Pin to the top of our profile</Text>
              <Text style={styles.toggleHint}>Shown in preview only for now.</Text>
            </View>
            <Switch
              value={form.isPinned}
              onValueChange={(value) => updateField('isPinned', value)}
              trackColor={{ false: styles.switchTrackOff.color, true: styles.switchTrackOn.color }}
              thumbColor={styles.switchThumb.color}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Announcement expires</Text>
              <Text style={styles.toggleHint}>Set a start and end date for this announcement.</Text>
            </View>
            <Switch
              value={form.hasExpiration}
              onValueChange={handleExpirationToggle}
              trackColor={{ false: styles.switchTrackOff.color, true: styles.switchTrackOn.color }}
              thumbColor={styles.switchThumb.color}
            />
          </View>

          {form.hasExpiration ? (
            <>
              <DateFormField
                label="Start Date"
                value={form.startDate}
                minimumDate={today}
                onChange={(value) => updateField('startDate', value)}
                error={errors.startDate}
              />
              <DateFormField
                label="End Date"
                value={form.endDate}
                minimumDate={endDateMinimum}
                onChange={(value) => updateField('endDate', value)}
                error={errors.endDate}
              />
            </>
          ) : null}

          <SectionHeader label="Notifications" hint="Saved for a future release." />

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Notify followers when published</Text>
              <Text style={styles.toggleHint}>No notifications are sent yet.</Text>
            </View>
            <Switch
              value={form.notifyFollowers}
              onValueChange={(value) => updateField('notifyFollowers', value)}
              trackColor={{ false: styles.switchTrackOff.color, true: styles.switchTrackOn.color }}
              thumbColor={styles.switchThumb.color}
            />
          </View>
        </ScrollView>

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
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
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
