import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { BusinessDayHoursEditor } from '@/components/business/business-day-hours-editor';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useVerifiedBusinessCreateGuard } from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  getOwnerBusinessHours,
  updateOwnerBusinessHours,
} from '@/services/businessHours';
import type { BusinessHoursValidationErrors, WeeklyBusinessHours } from '@/types/business-hours';
import { DAY_OF_WEEK_KEYS } from '@/types/business-hours';
import { validateWeeklyBusinessHours } from '@/utils/business-hours';

export default function BusinessSettingsHoursScreen() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to manage business hours.',
  });

  const styles = useThemedStyles(createStyles);
  const [schedule, setSchedule] = useState<WeeklyBusinessHours | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BusinessHoursValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveOverlayPhase, setSaveOverlayPhase] = useState<'idle' | 'loading' | 'success'>('idle');

  const loadHours = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const result = await getOwnerBusinessHours();

    setLoading(false);

    if (!result.ok) {
      setSchedule(null);
      setLoadError(result.message);
      return;
    }

    setSchedule(result.hours.weeklyHours);
    setTimezone(result.hours.timezone);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHours();
    }, [loadHours]),
  );

  const updateDay = (day: (typeof DAY_OF_WEEK_KEYS)[number], next: WeeklyBusinessHours[typeof day]) => {
    setSchedule((current) => (current ? { ...current, [day]: next } : current));
    setFieldErrors((current) => {
      if (!current[day]) {
        return current;
      }
      const nextErrors = { ...current };
      delete nextErrors[day];
      return nextErrors;
    });
  };

  const handleSave = async () => {
    if (!schedule || isSaving) {
      return;
    }

    const validation = validateWeeklyBusinessHours(schedule);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      Alert.alert('Check your hours', validation.message ?? 'Fix your weekly schedule.');
      return;
    }

    setIsSaving(true);
    setSaveOverlayPhase('loading');

    try {
      const result = await updateOwnerBusinessHours(schedule);

      if (!result.ok) {
        setSaveOverlayPhase('idle');
        Alert.alert('Unable to save hours', result.message);
        return;
      }

      setSchedule(result.hours.weeklyHours);
      setTimezone(result.hours.timezone);
      setSaveOverlayPhase('success');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Business Hours" onBackPress={() => router.back()} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loader.color} />
          <Text style={styles.centeredText}>Loading your schedule…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load hours</Text>
          <Text style={styles.centeredText}>{loadError}</Text>
        </View>
      ) : schedule ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introBlock}>
            <Text style={styles.introText}>
              Hours use your business&apos;s local time. Overnight periods can end the following
              morning.
            </Text>
            {timezone ? (
              <Text style={styles.timezoneLine}>Timezone: {timezone}</Text>
            ) : null}
          </View>

          <View style={styles.days}>
            {DAY_OF_WEEK_KEYS.map((day) => (
              <BusinessDayHoursEditor
                key={day}
                day={day}
                value={schedule[day]}
                error={fieldErrors[day]}
                onChange={(next) => updateDay(day, next)}
              />
            ))}
          </View>

          <PrimaryButton
            label="Save Hours"
            onPress={handleSave}
            loading={isSaving && saveOverlayPhase === 'loading'}
            disabled={isSaving || saveOverlayPhase !== 'idle'}
          />
        </ScrollView>
      ) : null}

      <BusinessSuccessOverlay
        visible={saveOverlayPhase !== 'idle'}
        phase={saveOverlayPhase === 'loading' ? 'loading' : 'success'}
        loadingTitle="Saving…"
        loadingMessage="Updating your weekly schedule."
        successTitle="Hours saved!"
        successMessage="Your weekly schedule has been saved."
        primaryAction={{
          label: 'Done',
          onPress: () => {
            setSaveOverlayPhase('idle');
            router.replace('/business-settings');
          },
        }}
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
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 12,
    },
    introBlock: {
      gap: 6,
    },
    introText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    timezoneLine: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.semiBold,
    },
    days: {
      gap: 8,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      gap: 10,
    },
    loader: {
      color: theme.emerald,
    },
    errorTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
      textAlign: 'center',
    },
    centeredText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
