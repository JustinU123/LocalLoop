import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatMenuItemPrice } from '@/services/menuItems';
import type { BusinessMenuItem } from '@/types/supabase-menu-item';
import { getAvailabilityLabel } from '@/utils/product-item-form';

type OwnerMenuItemManageCardProps = {
  item: BusinessMenuItem;
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function statusLabel(status: BusinessMenuItem['status']): string | null {
  if (status === 'published') {
    return null;
  }
  if (status === 'draft') {
    return 'Draft';
  }
  if (status === 'archived') {
    return 'Archived';
  }
  return status;
}

export function OwnerMenuItemManageCard({
  item,
  busy,
  onEdit,
  onDelete,
}: OwnerMenuItemManageCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const imageUri = item.imageUrl?.trim();
  const priceLabel = formatMenuItemPrice(item);
  const availabilityLabel = getAvailabilityLabel(item.availabilityStatus);
  const publishStatus = statusLabel(item.status);
  const category = item.category.trim();

  return (
    <View style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={28} color={theme.textSecondary} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Menu Item</Text>
          </View>
        </View>

        {category ? (
          <View style={styles.metaRow}>
            <Ionicons name="folder-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{category}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={14} color={theme.textSecondary} />
          <Text style={styles.metaText}>{priceLabel}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="pulse-outline" size={14} color={theme.textSecondary} />
          <Text style={styles.metaText}>{availabilityLabel}</Text>
          {publishStatus ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{publishStatus}</Text>
            </View>
          ) : null}
        </View>

        {item.description.trim() ? (
          <Text style={styles.description} numberOfLines={3}>
            {item.description.trim()}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            disabled={busy}
            onPress={onEdit}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
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
        </View>
      </View>
    </View>
  );
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
      height: 140,
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
      gap: 8,
    },
    title: {
      flex: 1,
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: -0.2,
    },
    badge: {
      backgroundColor: theme.emeraldGlow,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    badgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    metaText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.regular,
    },
    statusBadge: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statusBadgeText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    actionButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
    },
    deleteButton: {
      borderColor: `${theme.danger}55`,
    },
    actionPressed: {
      opacity: 0.85,
    },
    actionText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    deleteText: {
      color: theme.danger,
    },
  });
}
