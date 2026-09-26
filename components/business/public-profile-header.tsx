import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PublicProfileCompactAction } from '@/components/business/public-profile-compact-action';
import { PublicProfileStatsRow } from '@/components/business/public-profile-stats-row';
import { PublicProfileTabBar } from '@/components/business/public-profile-tab-bar';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import type { Business } from '@/data/businesses';
import { getAppleMapsDirectionsUrl } from '@/data/businesses';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { PublicProfileTab } from '@/types/public-profile-tab';
import { getBusinessInitials } from '@/utils/business-initials';

export type PublicProfilePrimaryCta = 'loading' | 'follow' | 'edit-profile';

type PublicProfileHeaderProps = {
  business: Business;
  insetsTop: number;
  activeTab: PublicProfileTab;
  primaryCta: PublicProfilePrimaryCta;
  following: boolean;
  saved: boolean;
  postCount: number;
  onTabChange: (tab: PublicProfileTab) => void;
  onToggleFollow: () => void;
  onEditProfile: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onOpenReviews: () => void;
};

export function PublicProfileHeader({
  business,
  insetsTop,
  activeTab,
  primaryCta,
  following,
  saved,
  postCount,
  onTabChange,
  onToggleFollow,
  onEditProfile,
  onToggleSave,
  onShare,
  onOpenReviews,
}: PublicProfileHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <View>
      <View style={styles.heroWrap}>
        {business.cover ? (
          <Image source={{ uri: business.cover }} style={styles.heroImage} contentFit="cover" transition={300} />
        ) : (
          <View style={[styles.heroImage, styles.heroFallback]}>
            <Text style={styles.heroFallbackText}>{getBusinessInitials(business.name)}</Text>
          </View>
        )}
        <View style={styles.heroOverlay} />
        <Pressable onPress={() => router.back()} style={[styles.backButton, { top: insetsTop + 8 }]}>
          <Ionicons name="chevron-back" size={22} color={theme.onImage} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCardTop}>
        <View style={styles.logoWrap}>
          {business.logo ? (
            <Image source={{ uri: business.logo }} style={styles.logo} contentFit="cover" transition={300} />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Text style={styles.logoFallbackText}>{getBusinessInitials(business.name)}</Text>
            </View>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.businessName} numberOfLines={2}>
            {business.name}
          </Text>
          {business.verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={theme.emerald} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.categoryLine} numberOfLines={1}>
          {business.category}
        </Text>

        {business.about ? (
          <Text style={styles.bio} numberOfLines={4}>
            {business.about}
          </Text>
        ) : null}

        <PublicProfileStatsRow
          rating={business.rating}
          postCount={postCount}
          followerCount={business.followerCount}
          onRatingPress={onOpenReviews}
        />

        <View style={styles.ctaRow}>
          {primaryCta === 'loading' ? (
            <View style={[styles.followButton, styles.followButtonPending]} pointerEvents="none">
              <ActivityIndicator size="small" color={theme.onEmerald} />
            </View>
          ) : primaryCta === 'edit-profile' ? (
            <Pressable
              onPress={onEditProfile}
              style={({ pressed }) => [styles.followButton, pressed && styles.buttonPressed]}>
              <Text style={styles.followButtonText}>Edit Profile</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onToggleFollow}
              style={({ pressed }) => [
                styles.followButton,
                following && styles.followButtonActive,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={[styles.followButtonText, following && styles.followButtonTextActive]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onToggleSave}
            style={({ pressed }) => [styles.saveProfileButton, pressed && styles.buttonPressed]}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? theme.emerald : theme.text}
            />
            <Text style={[styles.saveProfileText, saved && styles.saveProfileTextActive]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.compactActionsRow}>
          <PublicProfileCompactAction
            icon="navigate"
            label="Directions"
            onPress={() => {
              if (business.latitude && business.longitude) {
                Linking.openURL(getAppleMapsDirectionsUrl(business.latitude, business.longitude));
              }
            }}
          />
          <PublicProfileCompactAction
            icon="call"
            label="Call"
            onPress={() => {
              if (business.phone) {
                Linking.openURL(`tel:${business.phone}`);
              }
            }}
          />
          <PublicProfileCompactAction
            icon="globe-outline"
            label="Website"
            onPress={() => {
              if (business.website) {
                const url = business.website.startsWith('http')
                  ? business.website
                  : `https://${business.website}`;
                Linking.openURL(url);
              }
            }}
          />
          <PublicProfileCompactAction icon="share-outline" label="Share" onPress={onShare} />
        </View>

        <PublicProfileTabBar activeTab={activeTab} onTabChange={onTabChange} />
      </Animated.View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    heroWrap: {
      height: 188,
      position: 'relative',
      marginHorizontal: -16,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.emeraldGlow,
    },
    heroFallbackText: {
      color: theme.emerald,
      fontSize: 40,
      fontFamily: BrandFonts.bold,
    },
    heroOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.imageScrimMedium,
    },
    backButton: {
      position: 'absolute',
      left: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.imageControlBg,
      borderWidth: 1,
      borderColor: theme.imageControlBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileCardTop: {
      marginTop: -32,
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomWidth: 0,
      paddingHorizontal: 16,
      paddingTop: 42,
      paddingBottom: 0,
    },
    logoWrap: {
      position: 'absolute',
      top: -32,
      alignSelf: 'center',
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 3,
      borderColor: theme.bg,
      overflow: 'hidden',
      backgroundColor: theme.surfaceElevated,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    logoFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.emeraldGlow,
    },
    logoFallbackText: {
      color: theme.emerald,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      flexWrap: 'wrap',
      paddingHorizontal: 4,
    },
    businessName: {
      flexShrink: 1,
      color: theme.text,
      fontSize: 21,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
      textAlign: 'center',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.emeraldGlow,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
    },
    verifiedText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
    },
    categoryLine: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 6,
      fontFamily: BrandFonts.semiBold,
    },
    bio: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 10,
      paddingHorizontal: 4,
      fontFamily: BrandFonts.regular,
    },
    ctaRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    followButton: {
      flex: 1,
      minHeight: 36,
      borderRadius: 11,
      backgroundColor: theme.emerald,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    followButtonActive: {
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
    },
    followButtonPending: {
      opacity: 0.85,
    },
    followButtonText: {
      color: theme.onEmerald,
      fontSize: 14,
      fontFamily: BrandFonts.bold,
    },
    followButtonTextActive: {
      color: theme.emerald,
    },
    saveProfileButton: {
      flex: 1,
      minHeight: 36,
      borderRadius: 11,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.borderLight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    saveProfileText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.bold,
    },
    saveProfileTextActive: {
      color: theme.emerald,
    },
    buttonPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.98 }],
    },
    compactActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      gap: 4,
    },
  });
}
