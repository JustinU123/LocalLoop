import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatEngagementCount } from '@/utils/format-engagement-count';
import { parseAnnouncementCaption } from '@/utils/announcement-form';

type PublicProfilePostPreviewProps = {
  postId: string;
  postType: 'photo' | 'announcement';
  image?: string;
  caption: string;
  postedAt: string;
  likeCount: number;
  commentCount: number;
  engagementLoading?: boolean;
  engagementFailed?: boolean;
  showEngagement?: boolean;
  onPress: () => void;
};

function EngagementMeta({
  likeCount,
  commentCount,
  loading,
  failed,
}: {
  likeCount: number;
  commentCount: number;
  loading?: boolean;
  failed?: boolean;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createEngagementStyles);

  const likeLabel = loading ? '…' : failed ? '—' : formatEngagementCount(likeCount);
  const commentLabel = loading ? '…' : failed ? '—' : formatEngagementCount(commentCount);

  return (
    <View style={styles.row}>
      <View style={styles.chip}>
        <Ionicons name="heart-outline" size={16} color={theme.coral} />
        <Text style={styles.chipText}>{likeLabel}</Text>
      </View>
      <View style={styles.chip}>
        <Ionicons name="chatbubble-outline" size={16} color={theme.textSecondary} />
        <Text style={styles.chipText}>{commentLabel}</Text>
      </View>
    </View>
  );
}

export function PublicProfilePhotoPostPreview({
  image,
  caption,
  postedAt,
  likeCount,
  commentCount,
  engagementLoading,
  engagementFailed,
  showEngagement = true,
  onPress,
}: Omit<PublicProfilePostPreviewProps, 'postType' | 'caption'> & {
  postId: string;
  caption: string;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View post">
      {({ pressed }) => (
        <Animated.View
          entering={FadeInDown.duration(320)}
          style={[styles.postCard, pressed && styles.postCardPressed]}>
          {image ? (
            <Image source={{ uri: image }} style={styles.postImage} contentFit="cover" transition={250} />
          ) : null}
          <View style={styles.postBody}>
            <Text style={styles.postCaption}>{caption}</Text>
            <Text style={styles.postMeta}>{postedAt}</Text>
            {showEngagement ? (
              <EngagementMeta
                likeCount={likeCount}
                commentCount={commentCount}
                loading={engagementLoading}
                failed={engagementFailed}
              />
            ) : null}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

export function PublicProfileAnnouncementPostPreview({
  caption,
  postedAt,
  likeCount,
  commentCount,
  engagementLoading,
  engagementFailed,
  showEngagement = true,
  onPress,
}: Omit<PublicProfilePostPreviewProps, 'postType' | 'image' | 'postId'>) {
  const styles = useThemedStyles(createStyles);
  const { title, message } = parseAnnouncementCaption(caption);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View announcement"
      >
      {({ pressed }) => (
        <Animated.View
          entering={FadeInDown.duration(320)}
          style={[styles.postCard, pressed && styles.postCardPressed]}>
          <View style={styles.announcementBody}>
            <View style={styles.announcementBadge}>
              <Text style={styles.announcementBadgeText}>Announcement</Text>
            </View>
            {title ? <Text style={styles.announcementTitle}>{title}</Text> : null}
            <Text style={styles.announcementMessage}>{message || caption}</Text>
            <Text style={styles.postMeta}>{postedAt}</Text>
            {showEngagement ? (
              <EngagementMeta
                likeCount={likeCount}
                commentCount={commentCount}
                loading={engagementLoading}
                failed={engagementFailed}
              />
            ) : null}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

function createEngagementStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginTop: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    chipText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
  });
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    postCard: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      marginBottom: 12,
      ...theme.shadowCard,
    },
    postCardPressed: {
      opacity: 0.96,
    },
    postImage: {
      width: '100%',
      height: 220,
    },
    postBody: {
      padding: 16,
      gap: 6,
    },
    postCaption: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.medium,
    },
    postMeta: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    announcementBody: {
      padding: 16,
      gap: 8,
    },
    announcementBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    announcementBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    announcementTitle: {
      color: theme.text,
      fontSize: 18,
      lineHeight: 24,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    announcementMessage: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
  });
}
