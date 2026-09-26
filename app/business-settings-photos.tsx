import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { BusinessSuccessOverlay } from '@/components/business/business-success-overlay';
import { MediaSourceOption } from '@/components/business/media-source-option';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useVerifiedBusinessCreateGuard } from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  getOwnerBusinessBranding,
  removeOwnerBusinessCover,
  removeOwnerBusinessLogo,
  setOwnerBusinessCover,
  setOwnerBusinessLogo,
  type OwnerBusinessBranding,
} from '@/services/businessBranding';
import { getBusinessInitials } from '@/utils/business-initials';
import { pickPhotoFromCamera, pickPhotoFromLibrary } from '@/utils/business-media-picker';

type BrandingKind = 'logo' | 'cover';

export default function BusinessSettingsPhotosScreen() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to manage photos and branding.',
  });

  const styles = useThemedStyles(createStyles);
  const { businessRecord } = useAccountMode();
  const businessName = businessRecord?.name?.trim() || 'Business';
  const initials = useMemo(() => getBusinessInitials(businessName), [businessName]);

  const [branding, setBranding] = useState<OwnerBusinessBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pickerKind, setPickerKind] = useState<BrandingKind | null>(null);
  const [pickerLoading, setPickerLoading] = useState<'camera' | 'library' | null>(null);

  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [logoRemoving, setLogoRemoving] = useState(false);
  const [coverRemoving, setCoverRemoving] = useState(false);
  const [brandingOverlayPhase, setBrandingOverlayPhase] = useState<
    'idle' | 'loading' | 'success'
  >('idle');

  const loadBranding = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const result = await getOwnerBusinessBranding();
    setLoading(false);

    if (!result.ok) {
      setBranding(null);
      setLoadError(result.message);
      return;
    }

    setBranding(result.branding);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBranding();
    }, [loadBranding]),
  );

  const uploadAsset = async (kind: BrandingKind, asset: { uri: string; fileName?: string | null; width?: number; height?: number }) => {
    const params = {
      imageUri: asset.uri,
      fileName: asset.fileName,
      width: asset.width,
      height: asset.height,
    };

    setBrandingOverlayPhase('loading');

    if (kind === 'logo') {
      setLogoUploading(true);
      try {
        const result = await setOwnerBusinessLogo(params);
        if (!result.ok) {
          setBrandingOverlayPhase('idle');
          Alert.alert('Unable to update profile picture', result.message);
          return;
        }
        setBranding(result.branding);
        setBrandingOverlayPhase('success');
      } finally {
        setLogoUploading(false);
      }
      return;
    }

    setCoverUploading(true);
    try {
      const result = await setOwnerBusinessCover(params);
      if (!result.ok) {
        setBrandingOverlayPhase('idle');
        Alert.alert('Unable to update cover photo', result.message);
        return;
      }
      setBranding(result.branding);
      setBrandingOverlayPhase('success');
    } finally {
      setCoverUploading(false);
    }
  };

  const handlePick = async (kind: BrandingKind, source: 'camera' | 'library') => {
    setPickerLoading(source);
    try {
      const asset =
        source === 'camera' ? await pickPhotoFromCamera() : await pickPhotoFromLibrary();
      setPickerKind(null);
      if (!asset) {
        return;
      }
      await uploadAsset(kind, asset);
    } finally {
      setPickerLoading(null);
    }
  };

  const confirmRemove = (kind: BrandingKind) => {
    const isLogo = kind === 'logo';
    Alert.alert(
      isLogo ? 'Remove profile picture?' : 'Remove cover photo?',
      isLogo
        ? 'Your profile will show your business initials until you add a new photo.'
        : 'Your profile banner will use your profile picture or a neutral placeholder until you add a new cover.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (isLogo) {
                setLogoRemoving(true);
                try {
                  setBrandingOverlayPhase('loading');
                  const result = await removeOwnerBusinessLogo();
                  if (!result.ok) {
                    setBrandingOverlayPhase('idle');
                    Alert.alert('Unable to remove profile picture', result.message);
                    return;
                  }
                  setBranding(result.branding);
                  setBrandingOverlayPhase('success');
                } finally {
                  setLogoRemoving(false);
                }
                return;
              }

              setCoverRemoving(true);
              try {
                setBrandingOverlayPhase('loading');
                const result = await removeOwnerBusinessCover();
                if (!result.ok) {
                  setBrandingOverlayPhase('idle');
                  Alert.alert('Unable to remove cover photo', result.message);
                  return;
                }
                setBranding(result.branding);
                setBrandingOverlayPhase('success');
              } finally {
                setCoverRemoving(false);
              }
            })();
          },
        },
      ],
    );
  };

  const logoUrl = branding?.logoUrl ?? null;
  const coverUrl = branding?.coverImageUrl ?? null;
  const hasCustomLogo = Boolean(logoUrl);
  const hasCustomCover = Boolean(coverUrl);
  const coverPreviewUri = coverUrl ?? logoUrl;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Photos & Branding" onBackPress={() => router.back()} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loader.color} />
          <Text style={styles.centeredText}>Loading your photos…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load photos</Text>
          <Text style={styles.centeredText}>{loadError}</Text>
        </View>
      ) : branding ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile picture</Text>
            <Text style={styles.sectionHint}>Shown as your business profile photo.</Text>

            <View style={styles.logoRow}>
              <View style={styles.logoPreviewWrap}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.logoPreview} contentFit="cover" transition={200} />
                ) : (
                  <View style={[styles.logoPreview, styles.logoFallback]}>
                    <Text style={styles.logoFallbackText}>{initials}</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionsCol}>
                <Pressable
                  onPress={() => {
                    if (logoUploading || logoRemoving) {
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPickerKind('logo');
                  }}
                  disabled={logoUploading || logoRemoving}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                  {logoUploading ? (
                    <ActivityIndicator size="small" color={styles.actionButtonText.color} />
                  ) : (
                    <Text style={styles.actionButtonText}>Change photo</Text>
                  )}
                </Pressable>
                {hasCustomLogo ? (
                  <Pressable
                    onPress={() => {
                      if (logoUploading || logoRemoving) {
                        return;
                      }
                      confirmRemove('logo');
                    }}
                    disabled={logoUploading || logoRemoving}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}>
                    {logoRemoving ? (
                      <ActivityIndicator size="small" color={styles.removeButtonText.color} />
                    ) : (
                      <Text style={styles.removeButtonText}>Remove</Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover photo</Text>
            <Text style={styles.sectionHint}>Shown at the top of your business profile.</Text>

            <View style={styles.coverPreviewWrap}>
              {coverPreviewUri ? (
                <Image
                  source={{ uri: coverPreviewUri }}
                  style={styles.coverPreview}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.coverPreview, styles.coverFallback]}>
                  <Text style={styles.coverFallbackText}>{initials}</Text>
                </View>
              )}
              {!hasCustomCover && logoUrl ? (
                <View style={styles.coverPreviewBadge}>
                  <Text style={styles.coverPreviewBadgeText}>Using profile picture</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => {
                  if (coverUploading || coverRemoving) {
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPickerKind('cover');
                }}
                disabled={coverUploading || coverRemoving}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                {coverUploading ? (
                  <ActivityIndicator size="small" color={styles.actionButtonText.color} />
                ) : (
                  <Text style={styles.actionButtonText}>Change photo</Text>
                )}
              </Pressable>
              {hasCustomCover ? (
                <Pressable
                  onPress={() => {
                    if (coverUploading || coverRemoving) {
                      return;
                    }
                    confirmRemove('cover');
                  }}
                  disabled={coverUploading || coverRemoving}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}>
                  {coverRemoving ? (
                    <ActivityIndicator size="small" color={styles.removeButtonText.color} />
                  ) : (
                    <Text style={styles.removeButtonText}>Remove</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      ) : null}

      <Modal
        visible={pickerKind !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!pickerLoading) {
            setPickerKind(null);
          }
        }}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            if (!pickerLoading) {
              setPickerKind(null);
            }
          }}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {pickerKind === 'logo' ? 'Profile picture' : 'Cover photo'}
            </Text>
            <View style={styles.modalOptions}>
              <MediaSourceOption
                icon="camera-outline"
                label="Take photo"
                accent="emerald"
                disabled={pickerLoading !== null}
                onPress={() => {
                  if (pickerKind) {
                    void handlePick(pickerKind, 'camera');
                  }
                }}
              />
              <MediaSourceOption
                icon="images-outline"
                label="Choose from library"
                accent="emerald"
                disabled={pickerLoading !== null}
                onPress={() => {
                  if (pickerKind) {
                    void handlePick(pickerKind, 'library');
                  }
                }}
              />
            </View>
            <Pressable
              onPress={() => {
                if (!pickerLoading) {
                  setPickerKind(null);
                }
              }}
              disabled={pickerLoading !== null}
              style={({ pressed }) => [styles.modalCancel, pressed && styles.modalCancelPressed]}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <BusinessSuccessOverlay
        visible={brandingOverlayPhase !== 'idle'}
        phase={brandingOverlayPhase === 'loading' ? 'loading' : 'success'}
        loadingTitle="Saving…"
        loadingMessage="Updating your business branding."
        successTitle="Photos updated!"
        successMessage="Your business branding has been saved."
        primaryAction={{
          label: 'Done',
          onPress: () => setBrandingOverlayPhase('idle'),
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
      paddingTop: 8,
      gap: 8,
    },
    section: {
      gap: 10,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginVertical: 8,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    sectionHint: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginTop: 4,
    },
    logoPreviewWrap: {
      flexShrink: 0,
    },
    logoPreview: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    logoFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.emeraldGlow,
    },
    logoFallbackText: {
      color: theme.emerald,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
    },
    actionsCol: {
      flex: 1,
      gap: 10,
      minWidth: 0,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 4,
    },
    actionButton: {
      minHeight: 42,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonPressed: {
      opacity: 0.9,
    },
    actionButtonText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    removeButton: {
      minHeight: 42,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: BrandRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonPressed: {
      opacity: 0.85,
    },
    removeButtonText: {
      color: theme.danger,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    coverPreviewWrap: {
      borderRadius: BrandRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      marginTop: 4,
    },
    coverPreview: {
      width: '100%',
      height: 188,
    },
    coverFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceElevated,
    },
    coverFallbackText: {
      color: theme.textSecondary,
      fontSize: 36,
      fontFamily: BrandFonts.bold,
    },
    coverPreviewBadge: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.imageControlBg,
      borderWidth: 1,
      borderColor: theme.imageControlBorder,
    },
    coverPreviewBadgeText: {
      color: theme.onImage,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
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
    modalOptions: {
      gap: 10,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
      marginBottom: 4,
    },
    modalCancel: {
      marginTop: 4,
      alignItems: 'center',
      paddingVertical: 12,
    },
    modalCancelPressed: {
      opacity: 0.85,
    },
    modalCancelText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
