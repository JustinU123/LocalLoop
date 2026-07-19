import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MediaSourceOption } from '@/components/business/media-source-option';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { pickPhotoFromCamera, pickPhotoFromLibrary } from '@/utils/business-media-picker';

type PromotionImageFieldProps = {
  imageUri: string | null;
  onChange: (uri: string | null) => void;
  disabled?: boolean;
  label?: string;
  addButtonLabel?: string;
  changeButtonLabel?: string;
  removeButtonLabel?: string;
  modalTitle?: string;
  placeholderText?: string;
  error?: string;
};

export function PromotionImageField({
  imageUri,
  onChange,
  disabled = false,
  label = 'Promotion Image',
  addButtonLabel = 'Add Promotion Image',
  changeButtonLabel = 'Change Image',
  removeButtonLabel = 'Remove Image',
  modalTitle = 'Promotion Image',
  placeholderText = 'Add a photo to help your promotion stand out.',
  error,
}: PromotionImageFieldProps) {
  const styles = useThemedStyles(createStyles);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handlePick = async (action: 'camera' | 'library') => {
    setLoadingAction(action);
    try {
      const asset =
        action === 'camera' ? await pickPhotoFromCamera() : await pickPhotoFromLibrary();
      if (asset) {
        onChange(asset.uri);
        setSheetVisible(false);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.imageCard, error && styles.imageCardError]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={34} color={styles.placeholderIcon.color} />
            <Text style={styles.placeholderText}>{placeholderText}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            if (disabled) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSheetVisible(true);
          }}
          disabled={disabled || loadingAction !== null}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          {loadingAction ? (
            <ActivityIndicator color={styles.primaryButtonText.color} />
          ) : (
            <Text style={styles.primaryButtonText}>{imageUri ? changeButtonLabel : addButtonLabel}</Text>
          )}
        </Pressable>
        {imageUri ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onChange(null);
            }}
            disabled={disabled}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <Text style={styles.secondaryButtonText}>{removeButtonLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={sheetVisible} transparent animationType="fade" onRequestClose={() => setSheetVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSheetVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <View style={styles.modalOptions}>
              <MediaSourceOption
                label="Take Photo"
                icon="camera-outline"
                onPress={() => handlePick('camera')}
                disabled={loadingAction !== null}
              />
              <MediaSourceOption
                label="Choose from Library"
                icon="images-outline"
                onPress={() => handlePick('library')}
                disabled={loadingAction !== null}
              />
            </View>
            <Pressable onPress={() => setSheetVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      gap: 10,
    },
    label: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    imageCard: {
      borderRadius: BrandRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      ...theme.shadowCard,
    },
    imageCardError: {
      borderColor: theme.danger,
    },
    image: {
      width: '100%',
      aspectRatio: 16 / 10,
      backgroundColor: theme.surfaceElevated,
    },
    placeholder: {
      aspectRatio: 16 / 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 24,
      backgroundColor: theme.surfaceElevated,
    },
    placeholderIcon: {
      color: theme.coral,
    },
    placeholderText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    actions: {
      gap: 10,
    },
    primaryButton: {
      backgroundColor: theme.coral,
      borderRadius: BrandRadius.md,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    primaryButtonPressed: {
      opacity: 0.92,
    },
    primaryButtonText: {
      color: theme.onCoral,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    secondaryButton: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    secondaryButtonPressed: {
      opacity: 0.9,
    },
    secondaryButtonText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
      padding: 20,
    },
    modalSheet: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 12,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
      textAlign: 'center',
    },
    modalOptions: {
      gap: 10,
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
    error: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
  });
}
