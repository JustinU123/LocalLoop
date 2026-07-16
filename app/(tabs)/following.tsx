import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopHeaderLogo } from '@/components/brand/local-loop-header-logo';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getBusinessById } from '@/data/businesses';
import { FOLLOWING_POSTS, FollowingPost } from '@/data/following-posts';

function FollowingPostCard({
  post,
  liked,
  saved,
  onToggleLike,
  onToggleSave,
  onViewBusiness,
  theme,
  styles,
}: {
  post: FollowingPost;
  liked: boolean;
  saved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onViewBusiness: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  const business = getBusinessById(post.businessId);

  if (!business) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: business.logo }} style={styles.avatar} contentFit="cover" transition={200} />
        <View style={styles.headerText}>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.postedAt}>{post.postedAt}</Text>
        </View>
      </View>

      <Image source={{ uri: post.postImage }} style={styles.postImage} contentFit="cover" transition={250} />

      <Text style={styles.caption}>{post.caption}</Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onToggleLike}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          hitSlop={8}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? theme.coral : theme.textSecondary} />
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          hitSlop={8}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? theme.emerald : theme.textSecondary}
          />
        </Pressable>
      </View>

      <Pressable
        onPress={onViewBusiness}
        style={({ pressed }) => [styles.viewBusinessButton, pressed && styles.viewBusinessButtonPressed]}>
        <Text style={styles.viewBusinessText}>View Business</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.onEmerald} />
      </Pressable>
    </View>
  );
}

export default function FollowingScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleLike = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const openBusiness = useCallback((businessId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/business/${businessId}`);
  }, []);

  const renderPost: ListRenderItem<FollowingPost> = useCallback(
    ({ item }) => (
      <FollowingPostCard
        post={item}
        liked={likedIds.has(item.id)}
        saved={savedIds.has(item.id)}
        onToggleLike={() => toggleLike(item.id)}
        onToggleSave={() => toggleSave(item.id)}
        onViewBusiness={() => openBusiness(item.businessId)}
        theme={theme}
        styles={styles}
      />
    ),
    [likedIds, savedIds, toggleLike, toggleSave, openBusiness, theme, styles],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={FOLLOWING_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <LocalLoopHeaderLogo style={styles.headerLogo} />
            <Text style={styles.title}>Following</Text>
            <Text style={styles.subtitle}>Promotions and updates from businesses you follow</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    header: {
      paddingTop: 4,
      paddingBottom: 20,
    },
    headerLogo: {
      marginBottom: 4,
    },
    title: {
      color: theme.text,
      fontSize: 34,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
      marginTop: 6,
      lineHeight: 22,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
      overflow: 'hidden' as const,
      ...theme.shadowCard,
    },
    cardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      padding: 14,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    businessName: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    postedAt: {
      color: theme.textMuted,
      fontSize: 13,
    },
    postImage: {
      width: '100%' as const,
      height: 220,
      backgroundColor: theme.surfaceElevated,
    },
    caption: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      paddingHorizontal: 14,
      paddingTop: 12,
      fontFamily: BrandFonts.medium,
    },
    actionsRow: {
      flexDirection: 'row' as const,
      gap: 8,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 4,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    iconButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.94 }],
    },
    viewBusinessButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      marginHorizontal: 14,
      marginBottom: 14,
      marginTop: 6,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.emerald,
      ...theme.shadowButton,
    },
    viewBusinessButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    viewBusinessText: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
    },
  });
}
