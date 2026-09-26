import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatPostCreatedAt } from '@/services/posts';
import type { BusinessPost } from '@/types/supabase-post';
import { parseAnnouncementCaption } from '@/utils/announcement-form';

type OwnerPostManageCardProps = {
  post: BusinessPost;
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function getPostPreviewText(post: BusinessPost): string {
  if (post.postType === 'announcement') {
    const { title, message } = parseAnnouncementCaption(post.caption ?? '');
    return title.trim() || message.trim() || 'Announcement';
  }

  return post.caption?.trim() || 'Photo post';
}

export function OwnerPostManageCard({ post, busy, onEdit, onDelete }: OwnerPostManageCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isPhoto = post.postType === 'photo';
  const imageUri = post.imageUrl?.trim();
  const typeLabel = isPhoto ? 'Photo' : 'Announcement';

  return (
    <View style={styles.card}>
      {isPhoto && imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons
            name={isPhoto ? 'image-outline' : 'megaphone-outline'}
            size={28}
            color={theme.textSecondary}
          />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{typeLabel}</Text>
          </View>
          <Text style={styles.postedAt}>Posted {formatPostCreatedAt(post.createdAt)}</Text>
        </View>

        <Text style={styles.previewText} numberOfLines={4}>
          {getPostPreviewText(post)}
        </Text>

        <View style={styles.actions}>
          <Pressable
            disabled={busy}
            onPress={onEdit}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={onDelete}
            style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.actionPressed]}>
            {busy ? (
              <ActivityIndicator size="small" color={theme.danger} />
            ) : (
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            )}
          </Pressable>
        </View>
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
    image: {
      width: '100%',
      height: 140,
      backgroundColor: theme.surfaceElevated,
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      padding: 16,
      gap: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    badge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: `${theme.emerald}55`,
      backgroundColor: `${theme.emerald}22`,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      color: theme.emerald,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    postedAt: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
    },
    previewText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    actionButton: {
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 36,
      justifyContent: 'center',
    },
    actionPressed: {
      opacity: 0.85,
    },
    actionText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    deleteButton: {
      borderColor: `${theme.danger}55`,
    },
    deleteText: {
      color: theme.danger,
    },
  });
}
