import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { ExplorePost } from '@/data/explore-posts';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getBusinessInitials } from '@/utils/business-initials';

type ExplorePostHeaderProps = {
  post: ExplorePost;
  isFollowing: boolean;
  showDistance: boolean;
  onPressBusiness: () => void;
  onToggleFollow: () => void;
};

export function ExplorePostHeader({
  post,
  isFollowing,
  showDistance,
  onPressBusiness,
  onToggleFollow,
}: ExplorePostHeaderProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressBusiness}
        style={({ pressed }) => [styles.businessTap, pressed && styles.businessTapPressed]}
        accessibilityRole="button"
        accessibilityLabel={`View ${post.businessName}`}>
        {post.businessLogo ? (
          <Image
            source={{ uri: post.businessLogo }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{getBusinessInitials(post.businessName)}</Text>
          </View>
        )}
        <View style={styles.textBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName}>{post.businessName}</Text>
            {post.verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={theme.emerald} />
                <Text style={styles.verifiedText}>Verified local</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{post.category}</Text>
            {showDistance && post.distance ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.distance}>{post.distance}</Text>
              </>
            ) : null}
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onToggleFollow}
        style={({ pressed }) => [
          styles.followButton,
          isFollowing && styles.followButtonActive,
          pressed && styles.followButtonPressed,
        ]}
        hitSlop={6}>
        <Text style={[styles.followLabel, isFollowing && styles.followLabelActive]}>
          {isFollowing ? 'Following' : 'Follow'}
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
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    businessTap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    businessTapPressed: {
      opacity: 0.85,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatarFallback: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFallbackText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.bold,
    },
    textBlock: {
      flex: 1,
      gap: 3,
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
    verifiedBadge: {
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
    verifiedText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
    },
    category: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    dot: {
      color: theme.textMuted,
      fontSize: 13,
    },
    distance: {
      color: theme.coral,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    followButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: BrandRadius.pill,
      borderWidth: 1,
      borderColor: theme.emerald,
      backgroundColor: theme.bg,
    },
    followButtonActive: {
      backgroundColor: theme.emeraldGlow,
      borderColor: theme.emerald,
    },
    followButtonPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.97 }],
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
