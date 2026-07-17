import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import {
  PHOTO_EDITOR_NEXT_MESSAGE,
  VIDEO_EDITOR_NEXT_MESSAGE,
} from '@/constants/business-media';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessCreateGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  clearBusinessMediaDraft,
  getBusinessMediaDraft,
  type BusinessMediaDraft,
} from '@/utils/business-media-draft';

function formatDuration(seconds?: number | null): string {
  if (!seconds) {
    return 'Unknown duration';
  }

  const wholeSeconds = Math.round(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remaining = wholeSeconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export default function BusinessMediaPreviewScreen() {
  useVerifiedBusinessCreateGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const [draft, setDraft] = useState<BusinessMediaDraft | null>(null);

  useEffect(() => {
    const nextDraft = getBusinessMediaDraft();
    if (!nextDraft) {
      router.back();
      return;
    }
    setDraft(nextDraft);
  }, []);

  const title = draft?.type === 'video' ? 'Video Preview' : 'Photo Preview';
  const changeLabel = draft?.type === 'video' ? 'Record Again' : 'Change Photo';
  const continueMessage =
    draft?.type === 'video' ? VIDEO_EDITOR_NEXT_MESSAGE : PHOTO_EDITOR_NEXT_MESSAGE;

  const summary = useMemo(() => {
    if (!draft) {
      return null;
    }

    if (draft.type === 'photo') {
      const dimensions =
        draft.width && draft.height ? `${draft.width} × ${draft.height}` : 'Image selected';
      return dimensions;
    }

    return [
      draft.fileName ? draft.fileName : 'Video selected',
      formatDuration(draft.duration),
    ].join(' · ');
  }, [draft]);

  const handleContinue = () => {
    Alert.alert('Coming next', continueMessage);
  };

  const handleChange = () => {
    if (!draft) {
      return;
    }

    clearBusinessMediaDraft();
    router.replace(draft.type === 'video' ? '/business-create-video' : '/business-create-photo');
  };

  const handleCancel = () => {
    clearBusinessMediaDraft();
    router.back();
  };

  if (!draft || !canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={title} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={title} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.previewCard}>
          {draft.type === 'photo' ? (
            <Image source={{ uri: draft.uri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <View style={styles.videoPlaceholder}>
              <View style={styles.videoIconWrap}>
                <Ionicons name="videocam" size={34} color={styles.videoIcon.color} />
              </View>
              <Text style={styles.videoTitle}>Video selected</Text>
              <Text style={styles.videoSummary}>{summary}</Text>
            </View>
          )}
        </View>

        {draft.type === 'photo' && summary ? (
          <Text style={styles.meta}>{summary}</Text>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label="Continue" onPress={handleContinue} />
          <Pressable onPress={handleChange} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{changeLabel}</Text>
          </Pressable>
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
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
      gap: 16,
    },
    previewCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    photoPreview: {
      width: '100%',
      aspectRatio: 4 / 5,
      backgroundColor: theme.surfaceElevated,
    },
    videoPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
      gap: 10,
      backgroundColor: theme.surfaceElevated,
    },
    videoIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.coralGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoIcon: {
      color: theme.coral,
    },
    videoTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.semiBold,
    },
    videoSummary: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    meta: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      textAlign: 'center',
    },
    actions: {
      gap: 12,
      marginTop: 4,
    },
    secondaryButton: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.coral,
      backgroundColor: theme.coralGlow,
      borderRadius: BrandRadius.md,
      paddingVertical: 14,
    },
    secondaryButtonText: {
      color: theme.coral,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    cancelButton: {
      alignSelf: 'center',
      paddingVertical: 8,
    },
    cancelText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
