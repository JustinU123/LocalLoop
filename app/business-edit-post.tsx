import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { FormFieldWithCounter } from '@/components/business/form-field-with-counter';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { ANNOUNCEMENT_FIELD_LIMITS } from '@/constants/announcement-create';
import { PHOTO_POST_CAPTION_MAX_LENGTH } from '@/constants/business-media';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessCreateGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  getOwnerPostById,
  updateOwnerAnnouncementPost,
  updateOwnerPhotoPostCaption,
} from '@/services/posts';
import type { BusinessPost } from '@/types/supabase-post';
import { parseAnnouncementCaption } from '@/utils/announcement-form';

export default function BusinessEditPostScreen() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to manage posts.',
  });
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const postId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');

  const [post, setPost] = useState<BusinessPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOverlayPhase, setSaveOverlayPhase] = useState<'idle' | 'loading' | 'success'>('idle');

  const [photoCaption, setPhotoCaption] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      if (!postId) {
        setLoadError('Post not found.');
        setLoading(false);
        return;
      }

      const result = await getOwnerPostById(postId);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setLoadError(result.message);
        setLoading(false);
        return;
      }

      setPost(result.post);
      if (result.post.postType === 'photo') {
        setPhotoCaption(result.post.caption?.trim() ?? '');
      } else {
        const { title, message } = parseAnnouncementCaption(result.post.caption ?? '');
        setAnnouncementTitle(title);
        setAnnouncementMessage(message);
      }
      setLoading(false);
    }

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const photoValid = useMemo(
    () => photoCaption.trim().length <= PHOTO_POST_CAPTION_MAX_LENGTH,
    [photoCaption],
  );

  const announcementValid = useMemo(() => {
    const title = announcementTitle.trim();
    const message = announcementMessage.trim();
    return (
      title.length > 0 &&
      message.length > 0 &&
      title.length <= ANNOUNCEMENT_FIELD_LIMITS.title &&
      message.length <= ANNOUNCEMENT_FIELD_LIMITS.message
    );
  }, [announcementTitle, announcementMessage]);

  const canSave = post?.postType === 'photo' ? photoValid : announcementValid;

  const handleSave = async () => {
    if (!post || !canSave || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveOverlayPhase('loading');

    const result =
      post.postType === 'photo'
        ? await updateOwnerPhotoPostCaption(post.id, photoCaption)
        : await updateOwnerAnnouncementPost(post.id, {
            title: announcementTitle,
            message: announcementMessage,
          });

    setSaving(false);

    if (!result.ok) {
      setSaveOverlayPhase('idle');
      setSaveError(result.message);
      return;
    }

    setSaveOverlayPhase('success');
  };

  const screenTitle =
    post?.postType === 'announcement' ? 'Edit Announcement' : 'Edit Photo Post';

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Edit Post" onBackPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Edit Post" onBackPress={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={loading ? 'Edit Post' : screenTitle} onBackPress={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={styles.loader.color} />
          </View>
        ) : post?.postType === 'photo' ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.intro}>
              Update the caption for this photo post. The image stays the same.
            </Text>
            {post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={styles.photoPreview} contentFit="cover" />
            ) : null}
            <FormFieldWithCounter
              label="Caption"
              value={photoCaption}
              maxLength={PHOTO_POST_CAPTION_MAX_LENGTH}
              onChangeText={setPhotoCaption}
              placeholder="Tell customers about this photo…"
              multiline
              error={
                photoCaption.trim().length > PHOTO_POST_CAPTION_MAX_LENGTH
                  ? `Maximum ${PHOTO_POST_CAPTION_MAX_LENGTH} characters.`
                  : undefined
              }
            />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.intro}>Update your announcement text.</Text>
            <FormFieldWithCounter
              label="Title"
              value={announcementTitle}
              maxLength={ANNOUNCEMENT_FIELD_LIMITS.title}
              onChangeText={setAnnouncementTitle}
              placeholder="Announcement title"
              error={
                !announcementTitle.trim() ? 'Announcement title is required.' : undefined
              }
            />
            <FormFieldWithCounter
              label="Message"
              value={announcementMessage}
              maxLength={ANNOUNCEMENT_FIELD_LIMITS.message}
              onChangeText={setAnnouncementMessage}
              placeholder="Share the details with your customers."
              multiline
              error={
                !announcementMessage.trim() ? 'Announcement message is required.' : undefined
              }
            />
          </ScrollView>
        )}

        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

        <View style={styles.footer}>
          <PrimaryButton
            label="Save Changes"
            onPress={handleSave}
            loading={saving && saveOverlayPhase === 'loading'}
            disabled={!canSave || loading || !post || saveOverlayPhase !== 'idle'}
          />
        </View>
      </KeyboardAvoidingView>

      <BusinessSuccessOverlay
        visible={saveOverlayPhase !== 'idle'}
        phase={saveOverlayPhase === 'loading' ? 'loading' : 'success'}
        loadingTitle="Saving…"
        loadingMessage="Updating your post."
        successTitle="Changes saved!"
        successMessage="Your changes have been saved."
        primaryAction={{
          label: 'Done',
          onPress: () => {
            setSaveOverlayPhase('idle');
            router.replace('/business-manage-posts');
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
    photoPreview: {
      width: '100%',
      aspectRatio: 4 / 5,
      maxHeight: 280,
      borderRadius: 16,
      backgroundColor: theme.surfaceElevated,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    loader: {
      color: theme.emerald,
    },
    errorText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    saveError: {
      color: theme.danger,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
      paddingHorizontal: 20,
      paddingBottom: 8,
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
