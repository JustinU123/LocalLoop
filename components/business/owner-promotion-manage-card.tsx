import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { OwnerManagedPromotion } from '@/services/promotions';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatPromotionScheduleFromIso } from '@/utils/promotion-display';
import { ownerPromotionLifecycleLabel } from '@/utils/promotion-owner';

type OwnerPromotionManageCardProps = {
  promotion: OwnerManagedPromotion;
  busy?: boolean;
  onEdit?: () => void;
  onEnd?: () => void;
  onDelete?: () => void;
};

export function OwnerPromotionManageCard({
  promotion,
  busy,
  onEdit,
  onEnd,
  onDelete,
}: OwnerPromotionManageCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const badgeLabel = ownerPromotionLifecycleLabel(promotion.lifecycle);
  const scheduleLabel = formatPromotionScheduleFromIso(promotion.startAt, promotion.endAt);
  const imageUri = promotion.imageUrl?.trim();
  const code = promotion.promotionCode?.trim();

  return (
    <View style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="pricetag-outline" size={28} color={theme.textSecondary} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {promotion.title}
          </Text>
          <View style={[styles.badge, badgeStyle(promotion.lifecycle, theme)]}>
            <Text style={[styles.badgeText, badgeTextStyle(promotion.lifecycle, theme)]}>{badgeLabel}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {promotion.description}
        </Text>

        {scheduleLabel ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{scheduleLabel}</Text>
          </View>
        ) : null}

        {code ? <Text style={styles.codeText}>Code: {code}</Text> : null}

        <View style={styles.actions}>
          {onEdit ? (
            <Pressable
              disabled={busy}
              onPress={onEdit}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          ) : null}
          {onEnd ? (
            <Pressable
              disabled={busy}
              onPress={onEnd}
              style={({ pressed }) => [styles.actionButton, styles.endButton, pressed && styles.actionPressed]}>
              {busy ? (
                <ActivityIndicator size="small" color={theme.coral} />
              ) : (
                <Text style={[styles.actionText, styles.endText]}>End Promotion</Text>
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

function badgeStyle(lifecycle: OwnerManagedPromotion['lifecycle'], theme: AppThemeTokens) {
  switch (lifecycle) {
    case 'active':
      return { backgroundColor: `${theme.emerald}22`, borderColor: `${theme.emerald}55` };
    case 'scheduled':
      return { backgroundColor: `${theme.coral}22`, borderColor: `${theme.coral}55` };
    default:
      return { backgroundColor: theme.surfaceElevated, borderColor: theme.border };
  }
}

function badgeTextStyle(lifecycle: OwnerManagedPromotion['lifecycle'], theme: AppThemeTokens) {
  switch (lifecycle) {
    case 'active':
      return { color: theme.emerald };
    case 'scheduled':
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
    description: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    codeText: {
      color: theme.text,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
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
    endButton: {
      borderColor: `${theme.coral}66`,
    },
    endText: {
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
