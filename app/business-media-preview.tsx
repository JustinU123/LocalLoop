import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { FormFieldWithCounter } from '@/components/business/form-field-with-counter';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import {
  PHOTO_POST_CAPTION_MAX_LENGTH,
  VIDEO_EDITOR_NEXT_MESSAGE,
} from '@/constants/business-media';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessCreateGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { publishPhotoPost } from '@/services/posts';
import {
  clearBusinessMediaDraft,
  getBusinessMediaDraft,
  type BusinessMediaDraft,
} from '@/utils/business-media-draft';
import { openBusinessProfile } from '@/utils/open-business-profile';

type PhotoPublishPhase = 'idle' | 'publishing' | 'success';

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
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [photoPublishPhase, setPhotoPublishPhase] = useState<PhotoPublishPhase>('idle');
  const [publishedBusinessId, setPublishedBusinessId] = useState<string | null>(null);
  const publishInFlightRef = useRef(false);

  const publishOverlayActive = photoPublishPhase !== 'idle';

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
  const continueMessage = VIDEO_EDITOR_NEXT_MESSAGE;

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

  const handleDoneAfterPublish = () => {
    router.replace('/(business-tabs)');
  };

  const handleViewPostAfterPublish = () => {
    if (!publishedBusinessId) {
      return;
    }

    router.replace('/(business-tabs)');
    openBusinessProfile(publishedBusinessId, {
      tab: 'posts',
      source: 'photo-post-publish',
    });
  };

  const handlePublish = async () => {
    if (!draft || draft.type !== 'photo' || publishInFlightRef.current || isPublishing) {
      return;
    }

    if (!draft.uri?.trim()) {
      Alert.alert('Photo required', 'Select a photo before publishing.');
      return;
    }

    publishInFlightRef.current = true;
    setIsPublishing(true);
    setPhotoPublishPhase('publishing');

    try {
      const result = await publishPhotoPost({
        imageUri: draft.uri,
        fileName: draft.fileName,
        caption,
      });

      if (!result.ok) {
        if (__DEV__) {
          console.error('[business-media-preview] publish failed', {
            code: result.code,
            message: result.message,
          });
        }
        setPhotoPublishPhase('idle');
        Alert.alert('Unable to publish', result.message);
        return;
      }

      clearBusinessMediaDraft();
      setCaption('');
      setPublishedBusinessId(result.post.businessId);
      setPhotoPublishPhase('success');
    } finally {
      publishInFlightRef.current = false;
      setIsPublishing(false);
    }
  };

  const handleChange = () => {
    if (!draft || publishOverlayActive) {
      return;
    }

    clearBusinessMediaDraft();
    router.replace(draft.type === 'video' ? '/business-create-video' : '/business-create-photo');
  };

  const handleCancel = () => {
    if (publishOverlayActive) {
      return;
    }

    clearBusinessMediaDraft();
    router.back();
  };

  const handleHeaderBack = () => {
    if (photoPublishPhase === 'publishing') {
      return;
    }

    if (photoPublishPhase === 'success') {
      handleDoneAfterPublish();
      return;
    }

    handleCancel();
  };

  if (!draft || !canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={title} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AccountScreenHeader title={title} onBackPress={handleHeaderBack} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEnabled={!publishOverlayActive}>
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

        {draft.type === 'photo' && summary ? <Text style={styles.meta}>{summary}</Text> : null}

        {draft.type === 'photo' ? (
          <FormFieldWithCounter
            label="Caption"
            value={caption}
            onChangeText={setCaption}
            maxLength={PHOTO_POST_CAPTION_MAX_LENGTH}
            placeholder="Add an optional caption for your photo post."
            multiline
            editable={!publishOverlayActive}
            helperText="Caption is optional, but your photo is required to publish."
          />
        ) : null}

        <View style={styles.actions}>
          {draft.type === 'photo' ? (
            <PrimaryButton
              label="Publish"
              onPress={() => {
                void handlePublish();
              }}
              loading={isPublishing && photoPublishPhase === 'publishing'}
              disabled={publishOverlayActive || !draft.uri}
            />
          ) : (
            <PrimaryButton label="Continue" onPress={handleContinue} />
          )}
          <Pressable
            onPress={handleChange}
            disabled={publishOverlayActive}
            style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{changeLabel}</Text>
          </Pressable>
          <Pressable
            onPress={handleCancel}
            disabled={publishOverlayActive}
            style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BusinessSuccessOverlay
        visible={publishOverlayActive}
        phase={photoPublishPhase === 'publishing' ? 'loading' : 'success'}
        loadingTitle="Publishing…"
        loadingMessage="Uploading your photo and saving your post."
        successTitle="Post published!"
        successMessage="Your post is now live."
        primaryAction={{ label: 'View Post', onPress: handleViewPostAfterPublish }}
        secondaryAction={{ label: 'Done', onPress: handleDoneAfterPublish }}
        accessibilityLabel={
          photoPublishPhase === 'publishing' ? 'Publishing your post' : 'Post published'
        }
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
