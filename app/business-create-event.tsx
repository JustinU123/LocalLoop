import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { DateFormField } from '@/components/business/date-form-field';
import { EventImageField } from '@/components/business/event-image-field';
import { FormFieldWithCounter } from '@/components/business/form-field-with-counter';
import { OptionChipGroup } from '@/components/business/option-chip-group';
import { TimeFormField } from '@/components/business/time-form-field';
import { UnsavedChangesDiscardModal } from '@/components/business/unsaved-changes-discard-modal';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import {
  EVENT_AGE_OPTIONS,
  EVENT_FIELD_LIMITS,
  EVENT_LOCATION_OPTIONS,
  EVENT_TICKET_OPTIONS,
} from '@/constants/event-create';
import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessEventGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { EventDraft } from '@/types/event-draft';
import { parseIsoDate, todayStart } from '@/utils/date-time';
import { getOwnerEventById } from '@/services/events';
import {
  clearEventDraft,
  beginEventEdit,
  clearEventEditSession,
  createEmptyEventDraft,
  getBusinessAddressLabel,
  getEventDraft,
  getEventEditSession,
  isEventFormEmpty,
  setEventDraft,
  validateEventForm,
} from '@/utils/event-form';

export default function BusinessCreateEventScreen() {
  useVerifiedBusinessEventGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { businessApplication } = useAccountMode();
  const { editId: editIdParam } = useLocalSearchParams<{ editId?: string | string[] }>();
  const editId = Array.isArray(editIdParam) ? (editIdParam[0] ?? '') : (editIdParam ?? '');
  const isEditing = Boolean(editId);

  const [form, setForm] = useState<EventDraft>(() => getEventDraft() ?? createEmptyEventDraft());
  const [loadingEdit, setLoadingEdit] = useState(isEditing);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      clearEventEditSession();
      return;
    }

    let cancelled = false;

    async function loadForEdit() {
      const session = getEventEditSession();
      if (session?.eventId === editId && getEventDraft()) {
        const draft = getEventDraft()!;
        if (!cancelled) {
          setForm(draft);
          setInitialSnapshot(JSON.stringify(draft));
          setLoadingEdit(false);
        }
        return;
      }

      const result = await getOwnerEventById(editId);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setEditLoadError(result.message);
        setLoadingEdit(false);
        return;
      }

      if (result.event.manageSection === 'ended') {
        setEditLoadError('Ended events cannot be edited.');
        setLoadingEdit(false);
        return;
      }

      beginEventEdit(result.event.id, result.event.draft, result.event.imageUrl);
      setForm(result.event.draft);
      setInitialSnapshot(JSON.stringify(result.event.draft));
      setLoadingEdit(false);
    }

    void loadForEdit();

    return () => {
      cancelled = true;
    };
  }, [editId, isEditing]);

  const businessAddress = getBusinessAddressLabel(businessApplication);
  const { valid, errors } = useMemo(() => validateEventForm(form), [form]);
  const isDirty = useMemo(() => {
    if (isEditing && initialSnapshot) {
      return JSON.stringify(form) !== initialSnapshot;
    }
    return !isEventFormEmpty(form);
  }, [form, initialSnapshot, isEditing]);
  const today = useMemo(() => todayStart(), []);
  const endDateMinimum = useMemo(() => {
    const eventDate = parseIsoDate(form.eventDate);
    if (eventDate && startOfDaySafe(eventDate) >= today) {
      return eventDate;
    }
    return today;
  }, [form.eventDate, today]);

  const { attemptBack, discardModalProps } = useUnsavedChangesGuard({
    isDirty,
    title: 'Discard this event?',
    onDiscard: clearEventDraft,
  });

  const updateField = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleContinue = () => {
    if (!valid || !canCreate) {
      return;
    }

    setEventDraft(form);
    setEventDraft(form);
    router.push('/business-event-preview');
  };

  const screenTitle = isEditing ? 'Edit Event' : 'Create Event';

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={screenTitle} onBackPress={attemptBack} />
        <UnsavedChangesDiscardModal {...discardModalProps} />
      </SafeAreaView>
    );
  }

  if (editLoadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={screenTitle} onBackPress={() => router.back()} />
        <View style={styles.errorWrap}>
          <Text style={styles.intro}>{editLoadError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={screenTitle} onBackPress={attemptBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}>
          {loadingEdit ? (
            <Text style={styles.intro}>Loading event…</Text>
          ) : (
            <Text style={styles.intro}>
              {isEditing
                ? 'Update your event details. Changes apply to the same event—nothing new is created.'
                : 'Share an upcoming event with nearby LocalLoop customers.'}
            </Text>
          )}

          <EventImageField
            imageUri={form.imageUri}
            onChange={(uri) => updateField('imageUri', uri)}
          />

          <FormFieldWithCounter
            label="Event Name"
            value={form.eventName}
            maxLength={EVENT_FIELD_LIMITS.eventName}
            onChangeText={(value) => updateField('eventName', value)}
            placeholder="Friday Night Live Music"
            error={errors.eventName}
          />

          <FormFieldWithCounter
            label="Description"
            value={form.description}
            maxLength={EVENT_FIELD_LIMITS.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Join us for live music, food, and drinks."
            multiline
            error={errors.description}
          />

          <SectionHeader label="Schedule" hint="Set when your event starts and ends." />

          <DateFormField
            label="Event Date"
            value={form.eventDate}
            minimumDate={today}
            onChange={(value) => updateField('eventDate', value)}
            error={errors.eventDate}
          />

          <TimeFormField
            label="Start Time"
            value={form.startTime}
            onChange={(value) => updateField('startTime', value)}
            error={errors.startTime}
          />

          <TimeFormField
            label="End Time"
            value={form.endTime}
            onChange={(value) => updateField('endTime', value)}
            error={errors.endTime}
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Event lasts multiple days</Text>
              <Text style={styles.toggleHint}>Show an end date for multi-day events.</Text>
            </View>
            <Switch
              value={form.isMultiDay}
              onValueChange={(value) => {
                updateField('isMultiDay', value);
                if (!value) {
                  updateField('endDate', null);
                }
              }}
              trackColor={{ false: styles.switchTrackOff.color, true: styles.switchTrackOn.color }}
              thumbColor={styles.switchThumb.color}
            />
          </View>

          {form.isMultiDay ? (
            <DateFormField
              label="End Date"
              value={form.endDate}
              minimumDate={endDateMinimum}
              onChange={(value) => updateField('endDate', value)}
              error={errors.endDate}
            />
          ) : null}

          <SectionHeader label="Location" hint="Tell customers where to find your event." />

          <OptionChipGroup
            label="Location Type"
            options={EVENT_LOCATION_OPTIONS}
            value={form.locationType}
            onChange={(value) => updateField('locationType', value)}
          />

          {form.locationType === 'business' ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Business address</Text>
              <Text style={styles.infoValue}>{businessAddress}</Text>
            </View>
          ) : null}

          {form.locationType === 'different' ? (
            <>
              <FormFieldWithCounter
                label="Venue Name"
                value={form.venueName}
                maxLength={80}
                onChangeText={(value) => updateField('venueName', value)}
                placeholder="Riverfront Pavilion"
                error={errors.venueName}
              />
              <FormFieldWithCounter
                label="Street Address"
                value={form.streetAddress}
                maxLength={120}
                onChangeText={(value) => updateField('streetAddress', value)}
                placeholder="123 Main Street"
                error={errors.streetAddress}
              />
              <FormFieldWithCounter
                label="City"
                value={form.city}
                maxLength={80}
                onChangeText={(value) => updateField('city', value)}
                placeholder="Springfield"
                error={errors.city}
              />
              <FormFieldWithCounter
                label="State"
                value={form.state}
                maxLength={40}
                onChangeText={(value) => updateField('state', value)}
                placeholder="CA"
                error={errors.state}
              />
              <FormFieldWithCounter
                label="ZIP Code"
                value={form.zipCode}
                maxLength={10}
                onChangeText={(value) => updateField('zipCode', value)}
                placeholder="90210"
                keyboardType="number-pad"
                error={errors.zipCode}
              />
            </>
          ) : null}

          {form.locationType === 'online' ? (
            <FormFieldWithCounter
              label="Event Link"
              value={form.eventLink}
              maxLength={300}
              onChangeText={(value) => updateField('eventLink', value)}
              placeholder="https://example.com/event"
              autoCapitalize="none"
              keyboardType="url"
              error={errors.eventLink}
            />
          ) : null}

          <SectionHeader label="Tickets & Entry" hint="How customers can attend your event." />

          <OptionChipGroup
            label="Ticket or Entry Type"
            options={EVENT_TICKET_OPTIONS}
            value={form.ticketType}
            onChange={(value) => updateField('ticketType', value)}
          />

          {form.ticketType === 'paid' ? (
            <>
              <FormFieldWithCounter
                label="Price"
                value={form.price}
                maxLength={10}
                onChangeText={(value) => updateField('price', value.replace(/[^0-9.]/g, ''))}
                placeholder="25.00"
                keyboardType="decimal-pad"
                error={errors.price}
              />
              <FormFieldWithCounter
                label="Ticket Link"
                value={form.ticketLink}
                maxLength={300}
                onChangeText={(value) => updateField('ticketLink', value)}
                placeholder="https://tickets.example.com"
                autoCapitalize="none"
                keyboardType="url"
                helperText="Optional for now."
                error={errors.ticketLink}
              />
            </>
          ) : null}

          {form.ticketType === 'rsvp' ? (
            <FormFieldWithCounter
              label="RSVP Link"
              value={form.rsvpLink}
              maxLength={300}
              onChangeText={(value) => updateField('rsvpLink', value)}
              placeholder="https://example.com/rsvp"
              autoCapitalize="none"
              keyboardType="url"
              error={errors.rsvpLink}
            />
          ) : null}

          <SectionHeader label="Details" hint="Optional information for attendees." />

          <FormFieldWithCounter
            label="Capacity"
            value={form.capacity}
            maxLength={6}
            onChangeText={(value) => updateField('capacity', value.replace(/[^0-9]/g, ''))}
            placeholder="100"
            keyboardType="number-pad"
            error={errors.capacity}
          />

          <OptionChipGroup
            label="Age Requirement"
            options={EVENT_AGE_OPTIONS}
            value={form.ageRequirement}
            onChange={(value) => updateField('ageRequirement', value)}
          />

          {form.ageRequirement === 'custom' ? (
            <FormFieldWithCounter
              label="Custom Age Requirement"
              value={form.customAgeRequirement}
              maxLength={EVENT_FIELD_LIMITS.customAgeRequirement}
              onChangeText={(value) => updateField('customAgeRequirement', value)}
              placeholder="16+ with parent"
              error={errors.customAgeRequirement}
            />
          ) : null}

          <FormFieldWithCounter
            label="Contact Name"
            value={form.contactName}
            maxLength={80}
            onChangeText={(value) => updateField('contactName', value)}
            placeholder="Alex Rivera"
          />

          <FormFieldWithCounter
            label="Contact Phone"
            value={form.contactPhone}
            maxLength={20}
            onChangeText={(value) => updateField('contactPhone', value)}
            placeholder="(555) 555-1234"
            keyboardType="phone-pad"
          />

          <FormFieldWithCounter
            label="Contact Email"
            value={form.contactEmail}
            maxLength={120}
            onChangeText={(value) => updateField('contactEmail', value)}
            placeholder="events@business.com"
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.contactEmail}
          />

          <FormFieldWithCounter
            label="Additional Information"
            value={form.additionalInformation}
            maxLength={EVENT_FIELD_LIMITS.additionalInformation}
            onChangeText={(value) => updateField('additionalInformation', value)}
            placeholder="Parking is available behind the building."
            multiline
            error={errors.additionalInformation}
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={isEditing ? 'Review Changes' : 'Continue'}
            onPress={handleContinue}
            disabled={!valid || loadingEdit}
          />
        </View>
      </KeyboardAvoidingView>
      <UnsavedChangesDiscardModal {...discardModalProps} />
    </SafeAreaView>
  );
}

function startOfDaySafe(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
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
    errorWrap: {
      paddingHorizontal: 20,
      paddingTop: 16,
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
    infoCard: {
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },
    infoLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    infoValue: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.medium,
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
