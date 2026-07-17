import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { MediaSourceOption } from '@/components/business/media-source-option';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessCreateGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { setBusinessMediaDraftFromAsset } from '@/utils/business-media-draft';
import { pickPhotoFromCamera, pickPhotoFromLibrary } from '@/utils/business-media-picker';

export default function BusinessCreatePhotoScreen() {
  useVerifiedBusinessCreateGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handlePick = async (action: 'camera' | 'library') => {
    if (!canCreate) {
      return;
    }

    setLoadingAction(action);
    try {
      const asset =
        action === 'camera' ? await pickPhotoFromCamera() : await pickPhotoFromLibrary();
      if (!asset) {
        return;
      }

      setBusinessMediaDraftFromAsset('photo', asset);
      router.push('/business-media-preview');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Photo Post" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Add a photo for your business post.</Text>

        <View style={styles.options}>
          <MediaSourceOption
            label="Take Photo"
            description="Open the camera to capture a new image."
            icon="camera-outline"
            onPress={() => handlePick('camera')}
            disabled={!canCreate || loadingAction !== null}
          />
          <MediaSourceOption
            label="Choose from Library"
            description="Select one photo from your library."
            icon="images-outline"
            onPress={() => handlePick('library')}
            disabled={!canCreate || loadingAction !== null}
          />
        </View>

        {loadingAction ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={styles.loadingIndicator.color} />
            <Text style={styles.loadingText}>Opening {loadingAction === 'camera' ? 'camera' : 'library'}…</Text>
          </View>
        ) : null}

        <Pressable onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
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
    intro: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    options: {
      gap: 12,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
    },
    loadingIndicator: {
      color: theme.emerald,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
    },
    cancelButton: {
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    cancelText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
