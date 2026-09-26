import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { OwnerManagedEvent } from '@/services/events';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatEventSchedule, getEventLocationLabel } from '@/utils/event-form';
import type { OwnerEventManageSection } from '@/utils/event-owner';

type OwnerEventManageCardProps = {
  event: OwnerManagedEvent;
  businessAddress: string;
  busy?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
};

export function OwnerEventManageCard({
  event,
  businessAddress,
  busy,
  onEdit,
  onCancel,
  onDelete,
}: OwnerEventManageCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const imageUri = event.imageUrl?.trim();
  const scheduleLabel = formatEventSchedule(event.draft);
  const locationLabel = getEventLocationLabel(event.draft, businessAddress);

  return (
    <View style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="calendar-outline" size={28} color={theme.textSecondary} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {event.draft.eventName}
          </Text>
          <View style={[styles.badge, badgeStyle(event.manageSection, theme)]}>
            <Text style={[styles.badgeText, badgeTextStyle(event.manageSection, theme)]}>
              {event.statusLabel}
            </Text>
          </View>
        </View>

        {scheduleLabel ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{scheduleLabel}</Text>
          </View>
        ) : null}

        {locationLabel ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.metaText} numberOfLines={2}>
              {locationLabel}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {onEdit ? (
            <Pressable
              disabled={busy}
              onPress={onEdit}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          ) : null}
          {onCancel ? (
            <Pressable
              disabled={busy}
              onPress={onCancel}
              style={({ pressed }) => [styles.actionButton, styles.cancelButton, pressed && styles.actionPressed]}>
              {busy ? (
                <ActivityIndicator size="small" color={theme.coral} />
              ) : (
                <Text style={[styles.actionText, styles.cancelText]}>Cancel Event</Text>
              )}
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              disabled={busy}
              onPress={onDelete}
              style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.actionPressed]}>
              {busy ? (
                <ActivityIndicator size="small" color={theme.danger} />
              ) : (
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function badgeStyle(section: OwnerEventManageSection, theme: AppThemeTokens) {
  switch (section) {
    case 'current':
      return { backgroundColor: `${theme.emerald}22`, borderColor: `${theme.emerald}55` };
    case 'upcoming':
      return { backgroundColor: `${theme.coral}22`, borderColor: `${theme.coral}55` };
    default:
      return { backgroundColor: theme.surfaceElevated, borderColor: theme.border };
  }
}

function badgeTextStyle(section: OwnerEventManageSection, theme: AppThemeTokens) {
  switch (section) {
    case 'current':
      return { color: theme.emerald };
    case 'upcoming':
      return { color: theme.coral };
    default:
      return { color: theme.textSecondary };
  }
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    image: {
      width: '100%',
      height: 160,
      backgroundColor: theme.surfaceElevated,
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      padding: 16,
      gap: 8,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    title: {
      flex: 1,
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    badge: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    metaText: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
      lineHeight: 18,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    actionButton: {
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 36,
      justifyContent: 'center',
    },
    actionPressed: {
      opacity: 0.85,
    },
    actionText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    cancelButton: {
      borderColor: `${theme.coral}66`,
    },
    cancelText: {
      color: theme.coral,
    },
    deleteButton: {
      borderColor: `${theme.danger}55`,
    },
    deleteText: {
      color: theme.danger,
    },
  });
}
