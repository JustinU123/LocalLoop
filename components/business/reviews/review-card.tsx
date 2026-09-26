import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatReviewDate } from '@/services/businessReviews';
import type { PublicBusinessReview } from '@/types/supabase-review';

type ReviewCardProps = {
  review: PublicBusinessReview;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function WholeStarRow({ rating }: { rating: number }) {
  const { theme } = useAppTheme();
  const wholeStars = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < wholeStars ? 'star' : 'star-outline'}
          size={13}
          color={theme.star}
        />
      ))}
    </View>
  );
}

export function ReviewCard({ review, canManage, onEdit, onDelete }: ReviewCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{review.authorDisplayName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.author}>{review.authorDisplayName}</Text>
          <WholeStarRow rating={review.rating} />
        </View>
        <Text style={styles.date}>{formatReviewDate(review.createdAt)}</Text>
      </View>
      {review.body ? <Text style={styles.body}>{review.body}</Text> : null}
      {canManage ? (
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.actionPressed]}>
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 10,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatarFallback: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.emerald,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    meta: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    author: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
    },
    date: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
    },
    body: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    actionButton: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.surface,
    },
    deleteButton: {
      borderColor: theme.danger,
    },
    actionText: {
      color: theme.text,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    deleteText: {
      color: theme.danger,
    },
    actionPressed: {
      opacity: 0.88,
    },
  });
}
