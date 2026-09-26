import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export type UnsavedChangesDiscardModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  onKeepEditing: () => void;
  onDiscard: () => void;
};

const DEFAULT_MESSAGE = "Your changes won't be saved.";

export function UnsavedChangesDiscardModal({
  visible,
  title,
  message = DEFAULT_MESSAGE,
  onKeepEditing,
  onDiscard,
}: UnsavedChangesDiscardModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepEditing}
      accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onKeepEditing}
          accessibilityRole="button"
          accessibilityLabel="Keep editing"
        />
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onKeepEditing}
              style={({ pressed }) => [styles.keepButton, pressed && styles.keepButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Keep editing">
              <Text style={styles.keepButtonText}>Keep Editing</Text>
            </Pressable>
            <Pressable
              onPress={onDiscard}
              style={({ pressed }) => [styles.discardButton, pressed && styles.discardButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Discard changes">
              <Text style={styles.discardButtonText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 18,
      gap: 10,
      ...theme.shadowCard,
    },
    title: {
      color: theme.text,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    message: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
      marginBottom: 6,
    },
    actions: {
      gap: 10,
      marginTop: 4,
    },
    keepButton: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.md,
      paddingVertical: 14,
    },
    keepButtonPressed: {
      opacity: 0.92,
    },
    keepButtonText: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    discardButton: {
      alignItems: 'center',
      backgroundColor: theme.danger,
      borderRadius: BrandRadius.md,
      paddingVertical: 14,
    },
    discardButtonPressed: {
      opacity: 0.92,
    },
    discardButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
