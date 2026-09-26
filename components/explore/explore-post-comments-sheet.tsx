import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { formatRelativePostTime } from '@/services/explorePosts';
import {
  addPostComment,
  getPostCommentsForFeed,
  softDeletePostComment,
} from '@/services/postEngagement';
import type { PublicPostComment } from '@/types/post-comment';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type ExplorePostCommentsSheetProps = {
  postId: string;
  currentUserId: string | null;
  isBusinessOwnerOfPost: boolean;
  onClose: () => void;
  onCommentCountChange: (postId: string, count: number) => void;
};

type LoadState = 'loading' | 'ready' | 'error';

export function ExplorePostCommentsSheet({
  postId,
  currentUserId,
  isBusinessOwnerOfPost,
  onClose,
  onCommentCountChange,
}: ExplorePostCommentsSheetProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<PublicPostComment>>(null);

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [comments, setComments] = useState<PublicPostComment[]>([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const canCompose = Boolean(currentUserId) && !isBusinessOwnerOfPost;
  const trimmedDraft = draft.trim();

  const onCommentCountChangeRef = useRef(onCommentCountChange);
  useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange;
  });
  const commentsFetchGenerationRef = useRef(0);

  const loadComments = useCallback(async () => {
    const trimmedPostId = postId.trim();
    if (!trimmedPostId) {
      return;
    }

    const generation = ++commentsFetchGenerationRef.current;
    setLoadState('loading');
    const result = await getPostCommentsForFeed(trimmedPostId);

    if (generation !== commentsFetchGenerationRef.current) {
      return;
    }

    if (!result.ok) {
      setLoadState('error');
      return;
    }

    setComments(result.comments);
    setLoadState('ready');
    onCommentCountChangeRef.current(trimmedPostId, result.comments.length);
  }, [postId]);

  useEffect(() => {
    // Fetch once per sheet mount / postId (sheet remounted via key when post changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch kickoff
    void loadComments();
  }, [postId, loadComments]);

  useEffect(() => {
    if (comments.length > 0 && loadState === 'ready') {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [comments.length, loadState]);

  const handleSubmit = useCallback(async () => {
    const trimmedPostId = postId.trim();
    if (!trimmedPostId || submitting || !trimmedDraft || !canCompose) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const result = await addPostComment(trimmedPostId, trimmedDraft);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    setDraft('');
    setComments((current) => {
      const next = [...current, result.comment];
      onCommentCountChangeRef.current(trimmedPostId, next.length);
      return next;
    });
  }, [postId, submitting, trimmedDraft, canCompose]);

  const confirmDelete = useCallback(
    (comment: PublicPostComment) => {
      Alert.alert('Delete comment?', 'This will remove your comment from the post.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const trimmedPostId = postId.trim();
              if (!trimmedPostId || deletingCommentId) {
                return;
              }

              setDeletingCommentId(comment.id);
              const result = await softDeletePostComment(comment.id);
              setDeletingCommentId(null);

              if (!result.ok) {
                Alert.alert('Unable to delete', 'Please try again in a moment.');
                return;
              }

              setComments((current) => {
                const next = current.filter((row) => row.id !== comment.id);
                onCommentCountChangeRef.current(trimmedPostId, next.length);
                return next;
              });
            })();
          },
        },
      ]);
    },
    [postId, deletingCommentId],
  );

  const openCommentMenu = useCallback(
    (comment: PublicPostComment) => {
      if (currentUserId !== comment.authorUserId) {
        return;
      }

      Alert.alert('Your comment', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete comment',
          style: 'destructive',
          onPress: () => confirmDelete(comment),
        },
      ]);
    },
    [currentUserId, confirmDelete],
  );

  const renderComment = useCallback(
    ({ item }: { item: PublicPostComment }) => {
      const isOwn = currentUserId === item.authorUserId;
      const initial = item.authorDisplayName.slice(0, 1).toUpperCase();

      return (
        <View style={styles.commentRow}>
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.commentBody}>
            <View style={styles.commentHeader}>
              <Text style={styles.authorName} numberOfLines={1}>
                {item.authorDisplayName}
              </Text>
              <Text style={styles.commentTime}>{formatRelativePostTime(item.createdAt)}</Text>
              {isOwn ? (
                <Pressable
                  onPress={() => openCommentMenu(item)}
                  hitSlop={10}
                  style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Comment options">
                  <Ionicons name="ellipsis-horizontal" size={18} color={styles.menuIcon.color} />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.commentText}>{item.body}</Text>
          </View>
        </View>
      );
    },
    [currentUserId, openCommentMenu, styles],
  );

  const listEmpty =
    loadState === 'ready' ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No comments yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to start the conversation.</Text>
      </View>
    ) : null;

  const listHeader =
    loadState === 'loading' ? (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={styles.loader.color} />
      </View>
    ) : null;

  const listFooter =
    loadState === 'error' ? (
      <View style={styles.errorState}>
        <Text style={styles.errorTitle}>Unable to load comments</Text>
        <Pressable
          onPress={() => {
            void loadComments();
          }}
          style={styles.retryButton}
          accessibilityRole="button">
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardRoot}
          pointerEvents="box-none">
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.sheetTitle}>Comments</Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Close comments">
                <Ionicons name="close" size={22} color={styles.closeIcon.color} />
              </Pressable>
            </View>

            <FlatList
              ref={listRef}
              data={loadState === 'ready' ? comments : []}
              keyExtractor={(item) => item.id}
              renderItem={renderComment}
              ListHeaderComponent={listHeader}
              ListEmptyComponent={listEmpty}
              ListFooterComponent={listFooter}
              contentContainerStyle={styles.listContent}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                if (comments.length > 0) {
                  listRef.current?.scrollToEnd({ animated: false });
                }
              }}
            />

            <View style={styles.composerWrap}>
              {isBusinessOwnerOfPost ? (
                <Text style={styles.ownerNotice}>
                  Comments are open to customers on your posts.
                </Text>
              ) : !currentUserId ? (
                <Text style={styles.ownerNotice}>Sign in to add a comment.</Text>
              ) : null}
              {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
              <View style={styles.composerRow}>
                {currentUserId ? (
                  <View style={styles.composerAvatar}>
                    <Ionicons name="person" size={16} color={styles.composerAvatarIcon.color} />
                  </View>
                ) : null}
                <TextInput
                  value={draft}
                  onChangeText={(text) => {
                    setDraft(text);
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                  placeholder="Add a comment…"
                  placeholderTextColor={styles.placeholder.color}
                  style={styles.composerInput}
                  editable={canCompose && !submitting}
                  multiline
                  maxLength={2000}
                />
                <Pressable
                  onPress={() => {
                    void handleSubmit();
                  }}
                  disabled={!canCompose || submitting || !trimmedDraft}
                  style={({ pressed }) => [
                    styles.postButton,
                    (!canCompose || submitting || !trimmedDraft) && styles.postButtonDisabled,
                    pressed && canCompose && trimmedDraft && styles.postButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Post comment">
                  <Text style={styles.postButtonText}>{submitting ? '…' : 'Post'}</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    keyboardRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '88%',
      minHeight: '52%',
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderBottomWidth: 0,
    },
    handleRow: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 4,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 8,
    },
    sheetTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonPressed: {
      opacity: 0.7,
    },
    closeIcon: {
      color: theme.textSecondary,
    },
    list: {
      flexGrow: 0,
      flexShrink: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      flexGrow: 1,
    },
    loadingWrap: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    loader: {
      color: theme.emerald,
    },
    emptyState: {
      paddingVertical: 40,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 6,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
    },
    emptySubtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorState: {
      paddingVertical: 32,
      alignItems: 'center',
      gap: 12,
    },
    errorTitle: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.medium,
    },
    retryButton: {
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    retryButtonText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    commentRow: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    avatarFallback: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.bold,
    },
    commentBody: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    authorName: {
      flexShrink: 1,
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.bold,
    },
    commentTime: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
    },
    menuButton: {
      marginLeft: 'auto',
      padding: 2,
    },
    menuButtonPressed: {
      opacity: 0.7,
    },
    menuIcon: {
      color: theme.textMuted,
    },
    commentText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    composerWrap: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderLight,
      paddingHorizontal: 14,
      paddingTop: 10,
      gap: 6,
    },
    ownerNotice: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
      paddingHorizontal: 4,
    },
    submitError: {
      color: theme.danger,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
      paddingHorizontal: 4,
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    composerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    composerAvatarIcon: {
      color: theme.textMuted,
    },
    composerInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
      lineHeight: 20,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      backgroundColor: theme.surfaceElevated,
    },
    placeholder: {
      color: theme.textSecondary,
    },
    postButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: BrandRadius.md,
      backgroundColor: theme.emerald,
      marginBottom: 4,
    },
    postButtonDisabled: {
      opacity: 0.45,
    },
    postButtonPressed: {
      opacity: 0.92,
    },
    postButtonText: {
      color: theme.onEmerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
