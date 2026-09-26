import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/account/primary-button';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export type BusinessSuccessAction = {
  label: string;
  onPress: () => void;
};

export type BusinessSuccessOverlayProps = {
  visible: boolean;
  phase: 'loading' | 'success';
  loadingTitle?: string;
  loadingMessage?: string;
  successTitle: string;
  successMessage: string;
  primaryAction?: BusinessSuccessAction;
  secondaryAction?: BusinessSuccessAction;
  accessibilityLabel?: string;
};

export function BusinessSuccessOverlay({
  visible,
  phase,
  loadingTitle = 'Saving…',
  loadingMessage,
  successTitle,
  successMessage,
  primaryAction,
  secondaryAction,
  accessibilityLabel,
}: BusinessSuccessOverlayProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && phase === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible, phase]);

  if (!visible) {
    return null;
  }

  const a11yLabel =
    accessibilityLabel ??
    (phase === 'loading' ? loadingTitle : successTitle);

  return (
    <View
      style={[styles.root, { paddingBottom: Math.max(insets.bottom, 20) }]}
      accessibilityViewIsModal
      accessibilityLabel={a11yLabel}>
      {phase === 'loading' ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.content}>
          <ActivityIndicator size="large" color={styles.spinner.color} />
          <Text style={styles.title}>{loadingTitle}</Text>
          {loadingMessage ? <Text style={styles.subtitle}>{loadingMessage}</Text> : null}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(280)} style={styles.content}>
          <Animated.View
            entering={ZoomIn.duration(420).springify().damping(16)}
            style={styles.successIconWrap}
            accessibilityRole="image"
            accessibilityLabel="Success">
            <Ionicons name="checkmark" size={40} color={styles.successIcon.color} />
          </Animated.View>
          <Text style={styles.title}>{successTitle}</Text>
          <Text style={styles.subtitle}>{successMessage}</Text>
          {primaryAction || secondaryAction ? (
            <View style={styles.actions}>
              {primaryAction ? (
                <PrimaryButton label={primaryAction.label} onPress={primaryAction.onPress} />
              ) : null}
              {secondaryAction ? (
                <Pressable
                  onPress={secondaryAction.onPress}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={secondaryAction.label}>
                  <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      )}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.bg,
      justifyContent: 'center',
      paddingHorizontal: 28,
      zIndex: 20,
    },
    content: {
      alignItems: 'center',
      gap: 14,
      width: '100%',
      maxWidth: 360,
      alignSelf: 'center',
    },
    spinner: {
      color: theme.emerald,
    },
    title: {
      color: theme.text,
      fontSize: 24,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
      textAlign: 'center',
      marginTop: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    successIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.emerald,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowButton,
    },
    successIcon: {
      color: theme.onEmerald,
    },
    actions: {
      width: '100%',
      gap: 12,
      marginTop: 12,
    },
    secondaryButton: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      paddingVertical: 14,
    },
    secondaryButtonPressed: {
      opacity: 0.92,
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
