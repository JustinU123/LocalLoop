import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { getAppleMapsDirectionsUrl } from '@/data/businesses';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useFollowedBusinesses } from '@/contexts/followed-businesses-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getBusinessInitials } from '@/utils/business-initials';
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
  const { isFollowing, toggleFollow } = useFollowedBusinesses();
  const businessId = business.profileId ?? business.id;
  const following = isFollowing(businessId);
  const locationLabel = [
    business.streetAddress?.trim(),
    business.city?.trim(),
    business.state?.trim(),
    business.postalCode?.trim(),
  ]
    .filter(Boolean)
    .join(', ');
  const showRating = business.reviewCount > 0;
  const logoUri = business.logo?.trim() ?? '';
  const imageUri = business.image?.trim() ?? '';
  const hasLogo = Boolean(logoUri);
  const hasPreviewImage = Boolean(imageUri) && imageUri !== logoUri;
  const descriptionText = business.description?.trim();
  const hasDistance = Boolean(business.distanceLabel?.trim());

  return (
    <View style={styles.card}>
      <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </Pressable>

      <View style={styles.headerRow}>
        {hasLogo ? (
          <Image source={{ uri: logoUri }} style={styles.avatar} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{getBusinessInitials(business.name)}</Text>
          </View>
        )}

        <View style={styles.headerMain}>
          <Text style={styles.name} numberOfLines={2}>
            {business.name}
          </Text>

          <View style={styles.badgeRow}>
            {business.isLocalLoopMember ? (
              <View style={styles.localLoopBadge}>
                <Ionicons name="checkmark-circle" size={12} color={theme.emerald} />
                <Text style={styles.localLoopBadgeText}>Verified local</Text>
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

          <Text style={styles.category} numberOfLines={1}>
            {business.category}
          </Text>

          {hasDistance ? (
            <Text style={styles.distance} numberOfLines={1}>
              {business.distanceLabel}
            </Text>
          ) : null}

          {showRating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={theme.star} />
              <Text style={styles.rating}>
                {business.rating.toFixed(1)} stars · {business.reviewCount} reviews
              </Text>
            </View>
          ) : null}
        </View>

        {hasPreviewImage ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" transition={200} />
        ) : null}
      </View>

      {locationLabel ? (
        <Text style={styles.address} numberOfLines={3}>
          {locationLabel}
        </Text>
      ) : null}

      {descriptionText ? (
        <Text style={styles.description} numberOfLines={2}>
          {descriptionText}
        </Text>
      ) : null}

      <Pressable
        onPress={onViewBusiness}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
        <Text style={styles.primaryButtonText}>View Business</Text>
      </Pressable>

      <View style={styles.secondaryActionsRow}>
        <Pressable
          onPress={() => Linking.openURL(getAppleMapsDirectionsUrl(business.latitude, business.longitude))}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          <Ionicons name="navigate-outline" size={18} color={theme.text} />
          <Text style={styles.secondaryButtonText} numberOfLines={1}>
            Directions
          </Text>
        </Pressable>
        <Pressable
          onPress={() => toggleFollow(businessId)}
          style={({ pressed }) => [
            styles.secondaryButton,
            following && styles.followButtonActive,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={6}>
          <Ionicons
            name={following ? 'heart' : 'heart-outline'}
            size={18}
            color={following ? theme.emerald : theme.text}
          />
          <Text
            style={[styles.secondaryButtonText, following && styles.followButtonTextActive]}
            numberOfLines={1}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          hitSlop={6}
          accessibilityLabel={saved ? 'Remove from saved' : 'Save business'}>
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
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 18,
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
      alignItems: 'flex-start',
      gap: 14,
      paddingRight: 28,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatarFallback: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFallbackText: {
      color: theme.emerald,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
    },
    headerMain: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },
    name: {
      color: theme.text,
      fontSize: 19,
      lineHeight: 24,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
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
    category: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.medium,
    },
    distance: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.semiBold,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    rating: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    previewImage: {
      width: 56,
      height: 56,
      borderRadius: BrandRadius.sm,
      backgroundColor: theme.surfaceElevated,
    },
    address: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: BrandFonts.regular,
      marginTop: 12,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      marginTop: 10,
    },
    primaryButton: {
      alignSelf: 'stretch',
      minHeight: 48,
      backgroundColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 20,
      paddingVertical: 14,
      marginTop: 16,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowButton,
    },
    primaryButtonText: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    secondaryActionsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
      marginTop: 10,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    secondaryButtonText: {
      flexShrink: 1,
      color: theme.text,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    followButtonActive: {
      backgroundColor: theme.emeraldGlow,
      borderColor: theme.emerald,
    },
    followButtonTextActive: {
      color: theme.emerald,
    },
    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
  });
}
