import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import {
  type SavedBusinessItem,
  type SavedPostItem,
  type SavedPromotionItem,
  useSavedItems,
} from '@/contexts/saved-items-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { openBusinessProfile } from '@/utils/open-business-profile';

type SavedSectionProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  emptyMessage: string;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
  children: ReactNode;
};

function SavedSection({ title, icon, emptyMessage, theme, styles, children }: SavedSectionProps) {
  const hasItems = Array.isArray(children)
    ? children.length > 0
    : children != null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={theme.emerald} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {hasItems ? (
        <View style={styles.sectionBody}>{children}</View>
      ) : (
        <View style={styles.sectionEmpty}>
          <Text style={styles.sectionEmptyText}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
}

function SavedBusinessRow({
  item,
  onViewBusiness,
  onUnsave,
  theme,
  styles,
}: {
  item: SavedBusinessItem;
  onViewBusiness: () => void;
  onUnsave: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.itemRow}>
      <Image source={{ uri: item.logo }} style={styles.itemAvatar} contentFit="cover" transition={200} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.category} · {item.distance}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={theme.star} />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.itemActions}>
          <Pressable
            onPress={onViewBusiness}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}>
            <Text style={styles.primaryActionText}>View Business</Text>
          </Pressable>
          <Pressable
            onPress={onUnsave}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
            hitSlop={6}>
            <Ionicons name="bookmark" size={18} color={theme.emerald} />
          </Pressable>
        </View>
      </View>
      <Image source={{ uri: item.image }} style={styles.itemThumb} contentFit="cover" transition={200} />
    </View>
  );
}

function SavedPostRow({
  item,
  onViewBusiness,
  onUnsave,
  theme,
  styles,
}: {
  item: SavedPostItem;
  onViewBusiness: () => void;
  onUnsave: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.itemRow}>
      <Image source={{ uri: item.mediaUri }} style={styles.itemThumb} contentFit="cover" transition={200} />
      <View style={styles.itemContent}>
        <View style={styles.mediaTypeRow}>
          <Ionicons
            name={item.mediaType === 'video' ? 'play-circle-outline' : 'image-outline'}
            size={14}
            color={theme.coral}
          />
          <Text style={styles.mediaTypeText}>
            {item.mediaType === 'video' ? 'Video' : 'Photo'}
          </Text>
        </View>
        <Text style={styles.itemTitle}>{item.businessName}</Text>
        <Text style={styles.itemCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <View style={styles.itemActions}>
          <Pressable
            onPress={onViewBusiness}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}>
            <Text style={styles.primaryActionText}>View Business</Text>
          </Pressable>
          <Pressable
            onPress={onUnsave}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
            hitSlop={6}>
            <Ionicons name="bookmark" size={18} color={theme.emerald} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SavedPromotionRow({
  item,
  onViewBusiness,
  onUnsave,
  theme,
  styles,
}: {
  item: SavedPromotionItem;
  onViewBusiness: () => void;
  onUnsave: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.itemRow}>
      <Image
        source={{ uri: item.promotionImage }}
        style={styles.itemThumb}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemMeta}>{item.businessName}</Text>
        <Text style={styles.expiryText}>{item.expiresLabel}</Text>
        <View style={styles.itemActions}>
          <Pressable
            onPress={onViewBusiness}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}>
            <Text style={styles.primaryActionText}>View Business</Text>
          </Pressable>
          <Pressable
            onPress={onUnsave}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
            hitSlop={6}>
            <Ionicons name="bookmark" size={18} color={theme.emerald} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function SavedScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {
    savedBusinesses,
    savedPosts,
    savedPromotions,
    unsaveBusiness,
    unsavePost,
    unsavePromotion,
  } = useSavedItems();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <LocalLoopWordmark style={styles.headerWordmark} />
          <Text style={styles.title}>Saved</Text>
          <Text style={styles.subtitle}>
            Your bookmarked businesses, posts, and promotions will appear here.
          </Text>
        </View>

        <SavedSection
          title="Saved Businesses"
          icon="storefront-outline"
          emptyMessage="Businesses you save from Home or business profiles will show up here."
          theme={theme}
          styles={styles}>
          {savedBusinesses.map((item) => (
            <SavedBusinessRow
              key={item.id}
              item={item}
              theme={theme}
              styles={styles}
              onViewBusiness={() => openBusinessProfile(item.id)}
              onUnsave={() => unsaveBusiness(item.id)}
            />
          ))}
        </SavedSection>

        <SavedSection
          title="Saved Posts"
          icon="images-outline"
          emptyMessage="Posts you bookmark in Explore will show up here."
          theme={theme}
          styles={styles}>
          {savedPosts.map((item) => (
            <SavedPostRow
              key={item.id}
              item={item}
              theme={theme}
              styles={styles}
              onViewBusiness={() => openBusinessProfile(item.businessId)}
              onUnsave={() => unsavePost(item.id)}
            />
          ))}
        </SavedSection>

        <SavedSection
          title="Saved Promotions"
          icon="pricetag-outline"
          emptyMessage="Promotions you save will show up here."
          theme={theme}
          styles={styles}>
          {savedPromotions.map((item) => (
            <SavedPromotionRow
              key={item.id}
              item={item}
              theme={theme}
              styles={styles}
              onViewBusiness={() => openBusinessProfile(item.businessId)}
              onUnsave={() => unsavePromotion(item.id)}
            />
          ))}
        </SavedSection>
      </ScrollView>
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
      paddingBottom: 120,
      gap: 14,
    },
    header: {
      paddingTop: 4,
      paddingBottom: 8,
    },
    headerWordmark: {
      marginBottom: 10,
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
    section: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    sectionBody: {
      gap: 1,
      backgroundColor: theme.border,
    },
    sectionEmpty: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    sectionEmptyText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
    },
    itemRow: {
      flexDirection: 'row',
      gap: 12,
      padding: 14,
      backgroundColor: theme.surface,
    },
    itemAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
    },
    itemThumb: {
      width: 72,
      height: 72,
      borderRadius: BrandRadius.sm,
      backgroundColor: theme.surfaceElevated,
    },
    itemContent: {
      flex: 1,
      gap: 4,
    },
    itemTitle: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    itemMeta: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    itemCaption: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    mediaTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    mediaTypeText: {
      color: theme.coral,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    expiryText: {
      color: theme.coral,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    primaryAction: {
      backgroundColor: theme.emerald,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    primaryActionText: {
      color: theme.onEmerald,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    secondaryAction: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.97 }],
    },
  });
}
