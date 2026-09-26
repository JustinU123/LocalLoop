import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { OwnerPostManageCard } from '@/components/business/owner-post-manage-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useVerifiedBusinessCreateGuard } from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { deleteOwnerPost, listOwnerPosts } from '@/services/posts';
import type { BusinessPost } from '@/types/supabase-post';

export default function BusinessManagePostsScreen() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to manage posts.',
  });

  const styles = useThemedStyles(createStyles);
  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  const loadPosts = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setErrorMessage(null);

    const result = await listOwnerPosts();

    if (mode === 'initial') {
      setLoading(false);
    } else {
      setRefreshing(false);
    }

    if (!result.ok) {
      setPosts([]);
      setErrorMessage(result.message);
      return;
    }

    setPosts(result.posts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPosts('initial');
    }, [loadPosts]),
  );

  const handleEdit = (post: BusinessPost) => {
    router.push({
      pathname: '/business-edit-post',
      params: { id: post.id },
    });
  };

  const confirmDeletePost = (post: BusinessPost) => {
    const label = post.postType === 'announcement' ? 'announcement' : 'photo post';
    Alert.alert(
      'Delete this post?',
      `This permanently removes this ${label}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyPostId(post.id);
              const result = await deleteOwnerPost(post.id);
              setBusyPostId(null);

              if (!result.ok) {
                Alert.alert('Unable to delete post', result.message);
                return;
              }

              setPosts((current) => current.filter((item) => item.id !== post.id));
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Manage Posts" onBackPress={() => router.back()} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loader.color} />
          <Text style={styles.centeredText}>Loading your posts…</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load posts</Text>
          <Text style={styles.centeredText}>{errorMessage}</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.centeredText}>
            Publish a photo post or announcement from the Create tab.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadPosts('refresh')} />
          }>
          {posts.map((post) => (
            <OwnerPostManageCard
              key={post.id}
              post={post}
              busy={busyPostId === post.id}
              onEdit={() => handleEdit(post)}
              onDelete={() => confirmDeletePost(post)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      gap: 12,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      gap: 10,
    },
    loader: {
      color: theme.emerald,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    errorTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
      textAlign: 'center',
    },
    centeredText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
