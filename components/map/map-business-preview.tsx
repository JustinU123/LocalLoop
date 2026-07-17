import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { getAppleMapsDirectionsUrl } from '@/data/businesses';
import { getMapBusinessDescription } from '@/data/map-businesses';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { MapBusinessWithDistance } from '@/utils/map-filters';

type MapBusinessPreviewProps = {
  business: MapBusinessWithDistance;
  saved: boolean;
  onToggleSave: () => void;
  onViewBusiness: () => void;
  onClose: () => void;
};

export function MapBusinessPreview({
  business,
  saved,
  onToggleSave,
  onViewBusiness,
  onClose,
}: MapBusinessPreviewProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </Pressable>

      <View style={styles.headerRow}>
        <Image source={{ uri: business.logo }} style={styles.avatar} contentFit="cover" transition={200} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{business.name}</Text>
          <Text style={styles.meta}>
            {business.category} · {business.distanceLabel}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={theme.star} />
            <Text style={styles.rating}>
              {business.rating.toFixed(1)} stars · {business.reviewCount} reviews
            </Text>
          </View>
        </View>
        <Image source={{ uri: business.image }} style={styles.previewImage} contentFit="cover" transition={200} />
      </View>

      <View style={styles.badgeRow}>
        {business.isLocalLoopMember ? (
          <View style={styles.localLoopBadge}>
            <Ionicons name="checkmark-circle" size={12} color={theme.emerald} />
            <Text style={styles.localLoopBadgeText}>LocalLoop Business</Text>
          </View>
        ) : !business.isChain ? (
          <View style={styles.unclaimedBadge}>
            <Text style={styles.unclaimedBadgeText}>Unclaimed</Text>
          </View>
        ) : null}
        {business.hasPromotion ? (
          <View style={styles.promotionBadge}>
            <Text style={styles.promotionBadgeText}>Promotion</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.description}>{getMapBusinessDescription(business)}</Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onViewBusiness}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryButtonText}>View Business</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(getAppleMapsDirectionsUrl(business.latitude, business.longitude))}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          <Ionicons name="navigate-outline" size={18} color={theme.text} />
          <Text style={styles.secondaryButtonText}>Directions</Text>
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          hitSlop={6}>
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
      padding: 16,
      zIndex: 20,
      elevation: 20,
      ...theme.shadowCard,
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 1,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingRight: 24,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerText: {
      flex: 1,
      gap: 3,
    },
    name: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    meta: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rating: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    previewImage: {
      width: 64,
      height: 64,
      borderRadius: BrandRadius.sm,
      backgroundColor: theme.surfaceElevated,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    localLoopBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    localLoopBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
    },
    promotionBadge: {
      backgroundColor: theme.coral,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    promotionBadgeText: {
      color: theme.onCoral,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
    },
    unclaimedBadge: {
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    unclaimedBadgeText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      marginTop: 10,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 14,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowButton,
    },
    primaryButtonText: {
      color: theme.onEmerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
  });
}
