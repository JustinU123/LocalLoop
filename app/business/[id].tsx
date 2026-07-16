import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Linking,
  ListRenderItem,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  Business,
  BusinessReview,
  BusinessVideo,
  MenuItem,
  getAppleMapsDirectionsUrl,
  getBusinessById,
} from '@/data/businesses';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.min(420, SCREEN_HEIGHT * 0.5);
const PHOTO_GAP = 10;
const PHOTO_WIDTH = (SCREEN_WIDTH - 72 - PHOTO_GAP) / 2;

type ProfileTab = 'videos' | 'photos' | 'menu' | 'reviews' | 'about';

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'photos', label: 'Photos' },
  { id: 'menu', label: 'Menu' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'about', label: 'About' },
];

type TabRow =
  | { key: string; kind: 'video-feed' }
  | { key: string; kind: 'photo'; uri: string; index: number }
  | { key: string; kind: 'menu-section'; title: string }
  | { key: string; kind: 'menu-item'; item: MenuItem }
  | { key: string; kind: 'review'; review: BusinessReview }
  | { key: string; kind: 'about' };

function CompactActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.compactAction, pressed && styles.compactActionPressed]}>
      <View style={styles.compactActionCircle}>
        <Ionicons name={icon} size={20} color={theme.onEmerald} />
      </View>
      <Text style={styles.compactActionLabel}>{label}</Text>
    </Pressable>
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half' : 'star-outline'}
          size={size}
          color={theme.star}
        />
      ))}
    </View>
  );
}

function VideoFeed({ videos }: { videos: BusinessVideo[] }) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <View style={styles.videoFeedContainer}>
      <ScrollView
        pagingEnabled
        snapToInterval={VIDEO_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        {videos.map((item) => (
          <View key={item.id} style={[styles.videoItem, { height: VIDEO_HEIGHT }]}>
            <Image source={{ uri: item.thumbnail }} style={styles.videoImage} contentFit="cover" transition={250} />
            <View style={styles.videoOverlay} />
            <View style={styles.videoPlayWrap}>
              <View style={styles.videoPlayButton}>
                <Ionicons name="play" size={28} color={theme.onImage} />
              </View>
            </View>
            <View style={styles.videoSideActions}>
              <View style={styles.videoSideAction}>
                <Ionicons name="heart" size={24} color={theme.onImage} />
                <Text style={styles.videoSideText}>{item.likes}</Text>
              </View>
              <View style={styles.videoSideAction}>
                <Ionicons name="chatbubble" size={24} color={theme.onImage} />
                <Text style={styles.videoSideText}>86</Text>
              </View>
              <View style={styles.videoSideAction}>
                <Ionicons name="share-social" size={24} color={theme.onImage} />
              </View>
            </View>
            <View style={styles.videoFooter}>
              <Text style={styles.videoCaption}>{item.caption}</Text>
              <Text style={styles.videoViews}>{item.views} views</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function buildTabRows(tab: ProfileTab, business: Business): TabRow[] {
  switch (tab) {
    case 'videos':
      return [{ key: 'video-feed', kind: 'video-feed' }];
    case 'photos':
      return business.photos.map((uri, index) => ({
        key: `photo-${index}`,
        kind: 'photo' as const,
        uri,
        index,
      }));
    case 'menu':
      return business.menu.flatMap((section) => [
        { key: `section-${section.title}`, kind: 'menu-section' as const, title: section.title },
        ...section.items.map((item) => ({
          key: `item-${section.title}-${item.name}`,
          kind: 'menu-item' as const,
          item,
        })),
      ]);
    case 'reviews':
      return business.reviews.map((review) => ({
        key: review.id,
        kind: 'review' as const,
        review,
      }));
    case 'about':
      return [{ key: 'about', kind: 'about' }];
    default:
      return [];
  }
}

type ProfileHeaderProps = {
  business: Business;
  insetsTop: number;
  activeTab: ProfileTab;
  following: boolean;
  saved: boolean;
  onTabChange: (tab: ProfileTab) => void;
  onToggleFollow: () => void;
  onToggleSave: () => void;
  onShare: () => void;
};

function ProfileHeader({
  business,
  insetsTop,
  activeTab,
  following,
  saved,
  onTabChange,
  onToggleFollow,
  onToggleSave,
  onShare,
}: ProfileHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <View>
      <View style={styles.heroWrap}>
        <Image source={{ uri: business.cover }} style={styles.heroImage} contentFit="cover" transition={300} />
        <View style={styles.heroOverlay} />
        <Pressable onPress={() => router.back()} style={[styles.backButton, { top: insetsTop + 8 }]}>
          <Ionicons name="chevron-back" size={22} color={theme.onImage} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCardTop}>
        <View style={styles.logoWrap}>
          <Image source={{ uri: business.logo }} style={styles.logo} contentFit="cover" transition={300} />
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.businessName}>{business.name}</Text>
          {business.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={theme.emerald} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <Text style={styles.categoryLine}>{business.category}</Text>

        <View style={styles.statsRow}>
          <Ionicons name="star" size={14} color={theme.star} />
          <Text style={styles.ratingText}>{business.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({business.reviewCount})</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.distanceText}>{business.distance}</Text>
          <Text style={styles.dot}>·</Text>
          <View style={[styles.statusPill, business.isOpen ? styles.openPill : styles.closedPill]}>
            <View style={[styles.statusDot, business.isOpen ? styles.openDot : styles.closedDot]} />
            <Text style={styles.statusText}>{business.isOpen ? 'Open' : 'Closed'}</Text>
          </View>
        </View>

        <View style={styles.ctaRow}>
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
          <Pressable
            onPress={onToggleSave}
            style={({ pressed }) => [styles.saveProfileButton, pressed && styles.buttonPressed]}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? theme.emerald : theme.text}
            />
            <Text style={[styles.saveProfileText, saved && styles.saveProfileTextActive]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.compactActionsRow}>
          <CompactActionButton
            icon="navigate"
            label="Directions"
            onPress={() => Linking.openURL(getAppleMapsDirectionsUrl(business.latitude, business.longitude))}
          />
          <CompactActionButton icon="call" label="Call" onPress={() => Linking.openURL(`tel:${business.phone}`)} />
          <CompactActionButton
            icon="globe-outline"
            label="Website"
            onPress={() => Linking.openURL(`https://${business.website}`)}
          />
          <CompactActionButton icon="share-outline" label="Share" onPress={onShare} />
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => onTabChange(tab.id)}
                style={[styles.tabChip, selected && styles.tabChipActive]}>
                <Text style={[styles.tabChipText, selected && styles.tabChipTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

export default function BusinessProfileScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const business = useMemo(() => getBusinessById(id ?? ''), [id]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('videos');
  const [following, setFollowing] = useState(false);
  const [saved, setSaved] = useState(false);

  const tabRows = useMemo(
    () => (business ? buildTabRows(activeTab, business) : []),
    [activeTab, business],
  );

  const handleShare = async () => {
    if (!business) return;
    await Share.share({
      message: `Check out ${business.name} on LocalLoop — ${business.website}`,
    });
  };

  const handleTabChange = (tab: ProfileTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const renderTabRow: ListRenderItem<TabRow> = ({ item, index }) => {
    if (!business) return null;

    if (item.kind === 'video-feed') {
      return (
        <Animated.View entering={FadeIn.duration(260)} style={styles.tabContentItem}>
          <VideoFeed videos={business.videos} />
        </Animated.View>
      );
    }

    if (item.kind === 'photo') {
      return (
        <Animated.View
          entering={FadeIn.delay(item.index * 60).duration(300)}
          style={[
            styles.photoTile,
            item.index % 3 === 0 ? styles.photoTileTall : styles.photoTileShort,
          ]}>
          <Image source={{ uri: item.uri }} style={styles.photoImage} contentFit="cover" transition={250} />
        </Animated.View>
      );
    }

    if (item.kind === 'menu-section') {
      return (
        <View style={styles.menuSectionHeader}>
          <Text style={styles.menuSectionTitle}>{item.title}</Text>
        </View>
      );
    }

    if (item.kind === 'menu-item') {
      return (
        <View style={styles.menuItem}>
          <View style={styles.menuItemHeader}>
            <Text style={styles.menuItemName}>{item.item.name}</Text>
            <Text style={styles.menuItemPrice}>{item.item.price}</Text>
          </View>
          <Text style={styles.menuItemDescription}>{item.item.description}</Text>
        </View>
      );
    }

    if (item.kind === 'review') {
      return (
        <Animated.View entering={FadeInDown.delay(index * 70).duration(320)} style={styles.reviewCardWrap}>
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Image source={{ uri: item.review.avatar }} style={styles.reviewAvatar} contentFit="cover" />
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewAuthor}>{item.review.author}</Text>
                <StarRow rating={item.review.rating} size={12} />
              </View>
              <Text style={styles.reviewDate}>{item.review.date}</Text>
            </View>
            <Text style={styles.reviewText}>{item.review.text}</Text>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(260)} style={styles.aboutContainer}>
        <Text style={styles.aboutText}>{business.about}</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.aboutRowText}>{business.hours}</Text>
          </View>
          <View style={styles.aboutRow}>
            <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.aboutRowText}>{business.address}</Text>
          </View>
          <View style={styles.aboutRow}>
            <Ionicons name="globe-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.aboutRowText}>{business.website}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (!business) {
    return (
      <View style={[styles.emptyState, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>Business not found</Text>
        <Pressable onPress={() => router.back()} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={activeTab}
        data={tabRows}
        keyExtractor={(item) => item.key}
        renderItem={renderTabRow}
        numColumns={activeTab === 'photos' ? 2 : 1}
        columnWrapperStyle={activeTab === 'photos' ? styles.photoRow : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <ProfileHeader
            business={business}
            insetsTop={insets.top}
            activeTab={activeTab}
            following={following}
            saved={saved}
            onTabChange={handleTabChange}
            onToggleFollow={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFollowing((value) => !value);
            }}
            onToggleSave={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSaved((value) => !value);
            }}
            onShare={handleShare}
          />
        }
        ListFooterComponent={<View style={styles.tabPanelFooter} />}
        ListHeaderComponentStyle={styles.listHeader}
      />
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  listHeader: {
    zIndex: 1,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  heroWrap: {
    height: 200,
    position: 'relative',
    marginHorizontal: -16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    marginTop: -36,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 0,
  },
  logoWrap: {
    position: 'absolute',
    top: -34,
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: theme.bg,
    overflow: 'hidden',
    backgroundColor: theme.surfaceElevated,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  businessName: {
    color: theme.text,
    fontSize: 22,
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
    fontWeight: '700',
  },
  categoryLine: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  ratingText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCount: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  dot: {
    color: theme.textMuted,
    fontSize: 14,
  },
  distanceText: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  openPill: {
    backgroundColor: theme.emeraldGlow,
  },
  closedPill: {
    backgroundColor: theme.closedBadgeBg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openDot: {
    backgroundColor: theme.emerald,
  },
  closedDot: {
    backgroundColor: theme.closed,
  },
  statusText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  followButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonActive: {
    backgroundColor: theme.emeraldGlow,
    borderWidth: 1,
    borderColor: theme.emerald,
  },
  followButtonText: {
    color: theme.onEmerald,
    fontSize: 15,
    fontFamily: BrandFonts.bold,
  },
  followButtonTextActive: {
    color: theme.emerald,
  },
  saveProfileButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveProfileText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
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
    marginTop: 14,
    paddingHorizontal: 2,
  },
  compactAction: {
    flex: 1,
    alignItems: 'center',
  },
  compactActionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  compactActionCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  compactActionLabel: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 14,
    paddingBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  tabChipActive: {
    backgroundColor: theme.emeraldGlow,
    borderColor: theme.emerald,
  },
  tabChipText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: theme.emerald,
  },
  tabContentItem: {
    backgroundColor: theme.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  videoFeedContainer: {
    height: VIDEO_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden' as const,
    backgroundColor: theme.bg,
  },
  videoItem: {
    width: '100%',
    position: 'relative',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.imageScrimSubtle,
  },
  videoPlayWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.imageControlBg,
    borderWidth: 1,
    borderColor: theme.imageControlBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSideActions: {
    position: 'absolute',
    right: 14,
    bottom: 80,
    gap: 16,
    alignItems: 'center',
  },
  videoSideAction: {
    alignItems: 'center',
    gap: 4,
  },
  videoSideText: {
    color: theme.onImage,
    fontSize: 12,
    fontWeight: '700',
  },
  videoFooter: {
    position: 'absolute',
    left: 16,
    right: 72,
    bottom: 20,
  },
  videoCaption: {
    color: theme.onImage,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  videoViews: {
    color: theme.onImageMuted,
    fontSize: 13,
  },
  photoRow: {
    gap: PHOTO_GAP,
    backgroundColor: theme.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 20,
  },
  photoTile: {
    width: PHOTO_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.surfaceElevated,
    marginBottom: PHOTO_GAP,
  },
  photoTileTall: {
    height: 220,
  },
  photoTileShort: {
    height: 160,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  menuSectionHeader: {
    backgroundColor: theme.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuSectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: theme.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 14,
  },
  menuItemName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  menuItemPrice: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  menuItemDescription: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  reviewCardWrap: {
    backgroundColor: theme.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  reviewCard: {
    backgroundColor: theme.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 14,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  reviewMeta: {
    flex: 1,
    gap: 4,
  },
  reviewAuthor: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  reviewDate: {
    color: theme.textMuted,
    fontSize: 12,
  },
  reviewText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  aboutContainer: {
    gap: 14,
    backgroundColor: theme.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  aboutText: {
    color: theme.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  aboutCard: {
    backgroundColor: theme.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 14,
    gap: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  aboutRowText: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  tabPanelFooter: {
    height: 12,
    backgroundColor: theme.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyButton: {
    backgroundColor: theme.emerald,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: theme.onEmerald,
    fontFamily: BrandFonts.bold,
  },
  });
}
