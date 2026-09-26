import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useFollowedBusinesses } from '@/contexts/followed-businesses-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessSearchResult } from '@/types/business-search';
import { getBusinessInitials } from '@/utils/business-initials';
import { openBusinessProfile } from '@/utils/open-business-profile';

type BusinessSearchResultRowProps = {
  business: BusinessSearchResult;
  onPressBusiness?: (businessId: string) => void;
};

export function BusinessSearchResultRow({ business, onPressBusiness }: BusinessSearchResultRowProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { isFollowing, toggleFollow } = useFollowedBusinesses();

  const following = isFollowing(business.id);

  const handleOpenBusiness = () => {
    if (onPressBusiness) {
      onPressBusiness(business.id);
      return;
    }
    openBusinessProfile(business.id, { source: 'search' });
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleOpenBusiness}
        style={({ pressed }) => [styles.businessTap, pressed && styles.businessTapPressed]}
        accessibilityRole="button"
        accessibilityLabel={`View ${business.name}`}>
        {business.imageUrl ? (
          <Image source={{ uri: business.imageUrl }} style={styles.avatar} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{getBusinessInitials(business.name)}</Text>
          </View>
        )}
        <View style={styles.textBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {business.name}
            </Text>
            {business.verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={theme.emerald} />
                <Text style={styles.verifiedText}>Verified local</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.category} numberOfLines={1}>
              {business.category}
            </Text>
            {business.locationLabel ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.location} numberOfLines={1}>
                  {business.locationLabel}
                </Text>
              </>
            ) : null}
            {business.distanceLabel ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.distance} numberOfLines={1}>
                  {business.distanceLabel}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={() => toggleFollow(business.id)}
        style={({ pressed }) => [
          styles.followButton,
          following && styles.followButtonActive,
          pressed && styles.followButtonPressed,
        ]}
        hitSlop={6}>
        <Text style={[styles.followLabel, following && styles.followLabelActive]}>
          {following ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    businessTap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
    },
    businessTapPressed: {
      opacity: 0.85,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: BrandRadius.sm,
      backgroundColor: theme.surfaceElevated,
    },
    avatarFallback: {
      width: 48,
      height: 48,
      borderRadius: BrandRadius.sm,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFallbackText: {
      color: theme.emerald,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    businessName: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
      flexShrink: 1,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.emeraldGlow,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    verifiedText: {
      color: theme.emerald,
      fontSize: 10,
      fontFamily: BrandFonts.semiBold,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    category: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      flexShrink: 1,
    },
    location: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
      flexShrink: 1,
    },
    distance: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    dot: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    followButton: {
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: theme.bg,
    },
    followButtonActive: {
      backgroundColor: theme.emeraldGlow,
    },
    followButtonPressed: {
      opacity: 0.85,
    },
    followLabel: {
      color: theme.emerald,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    followLabelActive: {
      color: theme.emerald,
    },
  });
}
