import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { StarRatingInput } from '@/components/business/reviews/star-rating-input';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  deleteBusinessReview,
  getBusinessReviewsBundle,
  upsertBusinessReview,
} from '@/services/businessReviews';
import { getPublicBusinessProfile } from '@/services/publicBusinessProfile';
import type { BusinessReviewRating } from '@/types/supabase-review';
import { getCurrentSession } from '@/utils/auth';

const REVIEW_BODY_MAX = 2000;

export default function BusinessReviewEditorScreen() {
  const styles = useThemedStyles(createStyles);
  const { businessId: businessIdParam } = useLocalSearchParams<{ businessId: string | string[] }>();
  const businessId = Array.isArray(businessIdParam) ? (businessIdParam[0] ?? '') : (businessIdParam ?? '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [rating, setRating] = useState<BusinessReviewRating | null>(null);
  const [body, setBody] = useState('');
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  const loadScreen = useCallback(async () => {
    setLoading(true);

    const session = await getCurrentSession();
    if (!session?.user?.id) {
      setLoading(false);
      Alert.alert('Sign in required', 'Please sign in to leave a review.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    const profileResult = await getPublicBusinessProfile(businessId);
    if (!profileResult.ok) {
      setLoading(false);
      Alert.alert('Business unavailable', profileResult.message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    setBusinessName(profileResult.business.name);

    const reviewsResult = await getBusinessReviewsBundle(businessId);
    if (reviewsResult.ok && reviewsResult.myReview) {
      setExistingReviewId(reviewsResult.myReview.id);
      setRating(reviewsResult.myReview.rating);
      setBody(reviewsResult.myReview.body);
    }

    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    void loadScreen();
  }, [loadScreen]);

  const handleSave = async () => {
    if (rating == null) {
      Alert.alert('Rating required', 'Choose a star rating from 1 to 5.');
      return;
    }

    setSaving(true);
    try {
      const result = await upsertBusinessReview({
        businessId,
        rating,
        body,
      });

      if (!result.ok) {
        Alert.alert('Unable to save review', result.message);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingReviewId) {
      return;
    }

    Alert.alert('Delete review?', 'This will remove your review from the business profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            const result = await deleteBusinessReview(existingReviewId);
            if (!result.ok) {
              Alert.alert('Unable to delete', result.message);
              return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Leave a Review" />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={styles.loadingIndicator.color} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={existingReviewId ? 'Edit Review' : 'Leave a Review'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.subtitle}>Share your experience with whole-star ratings only.</Text>

          <Text style={styles.label}>Your rating</Text>
          <StarRatingInput value={rating} onChange={setRating} />

          <Text style={styles.label}>Review (optional)</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="What did you enjoy? What should others know?"
            placeholderTextColor={styles.placeholder.color}
            style={styles.textArea}
            multiline
            maxLength={REVIEW_BODY_MAX}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {body.length}/{REVIEW_BODY_MAX}
          </Text>

          <PrimaryButton
            label={existingReviewId ? 'Save changes' : 'Submit review'}
            onPress={handleSave}
            loading={saving}
          />

          {existingReviewId ? (
            <Pressable
              onPress={handleDelete}
              disabled={saving}
              style={({ pressed }) => [styles.deleteLink, pressed && styles.deletePressed]}>
              <Text style={styles.deleteLinkText}>Delete review</Text>
            </Pressable>
          ) : null}
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
      gap: 12,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingIndicator: {
      color: theme.emerald,
    },
    businessName: {
      color: theme.text,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
      marginTop: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      marginBottom: 8,
    },
    label: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
      marginTop: 8,
    },
    textArea: {
      minHeight: 140,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      backgroundColor: theme.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    placeholder: {
      color: theme.textSecondary,
    },
    charCount: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
      textAlign: 'right',
    },
    deleteLink: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    deletePressed: {
      opacity: 0.85,
    },
    deleteLinkText: {
      color: theme.danger,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
