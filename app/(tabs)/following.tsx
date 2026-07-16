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

import { BrandFonts, BrandShadow, BusinessTheme as T } from '@/constants/business-theme';
import { getBusinessById } from '@/data/businesses';
import { FOLLOWING_POSTS, FollowingPost } from '@/data/following-posts';

function FollowingPostCard({
  post,
  liked,
  saved,
  onToggleLike,
  onToggleSave,
  onViewBusiness,
}: {
  post: FollowingPost;
  liked: boolean;
  saved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onViewBusiness: () => void;
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
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? T.coral : T.textSecondary} />
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          hitSlop={8}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? T.emerald : T.textSecondary}
          />
        </Pressable>
      </View>

      <Pressable
        onPress={onViewBusiness}
        style={({ pressed }) => [styles.viewBusinessButton, pressed && styles.viewBusinessButtonPressed]}>
        <Text style={styles.viewBusinessText}>View Business</Text>
        <Ionicons name="arrow-forward" size={16} color={T.onEmerald} />
      </Pressable>
    </View>
  );
}

export default function FollowingScreen() {
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
      />
    ),
    [likedIds, savedIds, toggleLike, toggleSave, openBusiness],
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
            <Text style={styles.eyebrow}>LocalLoop</Text>
            <Text style={styles.title}>Following</Text>
            <Text style={styles.subtitle}>Promotions and updates from businesses you follow</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  eyebrow: {
    color: T.textSecondary,
    fontSize: 12,
    fontFamily: BrandFonts.semiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: T.text,
    fontSize: 34,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: T.textSecondary,
    fontSize: 15,
    fontFamily: BrandFonts.regular,
    marginTop: 6,
    lineHeight: 22,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
    overflow: 'hidden',
    ...BrandShadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.borderLight,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  businessName: {
    color: T.text,
    fontSize: 16,
    fontWeight: '700',
  },
  postedAt: {
    color: T.textMuted,
    fontSize: 13,
  },
  postImage: {
    width: '100%',
    height: 220,
    backgroundColor: T.surfaceElevated,
  },
  caption: {
    color: T.text,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  viewBusinessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 14,
    marginTop: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: T.emerald,
  },
  viewBusinessButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  viewBusinessText: {
    color: T.onEmerald,
    fontSize: 15,
    fontFamily: BrandFonts.bold,
  },
});
