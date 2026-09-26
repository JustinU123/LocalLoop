import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useAccountMode } from '@/contexts/account-mode-context';
import {
  useCanManageVerifiedBusinessProfile,
  useVerifiedBusinessCreateGuard,
} from '@/hooks/use-verified-business-create-guard';
import { updateVerifiedBusinessProfile } from '@/services/businessProfile';
import type { BusinessProfileForm, BusinessProfileFormErrors } from '@/types/business-profile-form';
import { businessRowToProfileForm } from '@/utils/business-profile-form';
import type { BusinessRow } from '@/types/supabase-business';

type SaveProfileOptions = {
  mergedForm: BusinessProfileForm;
  sectionValidation: {
    valid: boolean;
    errors: BusinessProfileFormErrors;
    message: string | null;
  };
  successTitle?: string;
  successMessage?: string;
};

export type ProfileSaveSuccessOverlay = {
  title: string;
  message: string;
};

export function useVerifiedBusinessProfileEditor() {
  useVerifiedBusinessCreateGuard({
    requireBusinessMode: false,
    blockedTitle: 'Business profile unavailable',
    blockedMessage: 'Verify your business before editing your public profile.',
  });

  const canEdit = useCanManageVerifiedBusinessProfile();
  const { businessRecord, verificationStatus, refreshAccountMode, isReady } = useAccountMode();
  const sourceRowRef = useRef<BusinessRow | null>(businessRecord);
  const [isSaving, setIsSaving] = useState(false);
  const [saveOverlayPhase, setSaveOverlayPhase] = useState<'idle' | 'loading' | 'success'>('idle');
  const [saveSuccessOverlay, setSaveSuccessOverlay] = useState<ProfileSaveSuccessOverlay | null>(
    null,
  );
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    if (businessRecord) {
      sourceRowRef.current = businessRecord;
    }
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

  const initialForm = businessRecord ? businessRowToProfileForm(businessRecord) : null;
  const isLoading = !isReady || !businessRecord || !canEdit || verificationStatus !== 'verified';

  const persistProfileSection = async (options: SaveProfileOptions): Promise<boolean> => {
    const row = sourceRowRef.current;
    if (!row || saveInFlightRef.current || isSaving) {
      return false;
    }

    if (!options.sectionValidation.valid) {
      Alert.alert(
        'Check your profile',
        options.sectionValidation.message ?? 'Complete all required fields.',
      );
      return false;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveOverlayPhase('loading');
    setSaveSuccessOverlay(null);

    try {
      const result = await updateVerifiedBusinessProfile(options.mergedForm, row);

      if (!result.ok) {
        setSaveOverlayPhase('idle');
        Alert.alert('Unable to save', result.message);
        return false;
      }

      await refreshAccountMode();
      sourceRowRef.current = result.business;

      let message =
        options.successMessage ?? 'Your business information has been saved.';
      if (result.geocoded) {
        message += ' Your address was geocoded and map coordinates were saved.';
      } else if (result.coordinatesCleared) {
        message +=
          ' Your address was saved, but map coordinates could not be resolved on this device. Distance and map placement may be unavailable until coordinates are added.';
      }

      setSaveSuccessOverlay({
        title: options.successTitle ?? 'Profile updated!',
        message,
      });
      setSaveOverlayPhase('success');
      return true;
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const dismissSaveSuccessOverlay = useCallback(() => {
    setSaveOverlayPhase('idle');
    setSaveSuccessOverlay(null);
    router.replace('/business-settings');
  }, []);

  return {
    canEdit,
    businessRecord,
    initialForm,
    isLoading,
    isSaving,
    saveOverlayPhase,
    saveSuccessOverlay,
    dismissSaveSuccessOverlay,
    sourceRowRef,
    persistProfileSection,
  };
}
