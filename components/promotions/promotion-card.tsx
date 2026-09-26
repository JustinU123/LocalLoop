import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { PromotionFeedItem } from '@/types/promotion-feed';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type PromotionCardProps = {
  promotion: PromotionFeedItem;
  saved: boolean;
  onToggleSave: () => void;
  onViewBusiness: () => void;
};

export function PromotionCard({
  promotion,
  saved,
  onToggleSave,
  onViewBusiness,
}: PromotionCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {promotion.businessLogo ? (
          <Image
            source={{ uri: promotion.businessLogo }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="storefront-outline" size={20} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName}>{promotion.businessName}</Text>
            {promotion.verified ? (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={12} color={theme.emerald} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            ) : null}
          </View>
          {promotion.distanceLabel ? (
            <Text style={styles.distance}>{promotion.distanceLabel}</Text>
          ) : null}
        </View>
      </View>

      {promotion.promotionImage ? (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: promotion.promotionImage }}
            style={styles.promotionImage}
            contentFit="cover"
            transition={250}
          />
          <View style={styles.promotionBadge}>
            <Text style={styles.promotionBadgeText}>PROMOTION</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.title}>{promotion.title}</Text>
        <Text style={styles.description}>{promotion.description}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={styles.metaText}>{promotion.scheduleLabel}</Text>
        </View>
        {promotion.expiresLabel ? (
          <Text style={styles.metaSubtext}>{promotion.expiresLabel}</Text>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onViewBusiness}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          <Text style={styles.primaryButtonText}>View Business</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.onEmerald} />
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          hitSlop={8}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? theme.emerald : theme.textSecondary}
          />
        </Pressable>
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
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    nameRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    businessName: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.emeraldGlow,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: theme.emerald,
    },
    badgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
    },
    localBadge: {
      backgroundColor: theme.coralGlow,
      borderColor: theme.coral,
    },
    localBadgeText: {
      color: theme.coral,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
    },
    distance: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    imageWrap: {
      position: 'relative',
      marginHorizontal: 16,
      borderRadius: BrandRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.surfaceElevated,
    },
    promotionImage: {
      width: '100%',
      height: 200,
    },
    promotionBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: theme.coral,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    promotionBadgeText: {
      color: theme.onCoral,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.6,
    },
    body: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 4,
      gap: 8,
    },
    title: {
      color: theme.text,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
      lineHeight: 26,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    metaText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      flex: 1,
    },
    metaSubtext: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      marginTop: -4,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 16,
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.emerald,
      borderRadius: 14,
      paddingVertical: 14,
      ...theme.shadowButton,
    },
    primaryButtonPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    primaryButtonText: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    saveButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.96 }],
    },
  });
}
