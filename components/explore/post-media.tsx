import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import type { ExplorePostMediaType } from '@/data/explore-posts';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MEDIA_HEIGHT = Math.min(420, SCREEN_WIDTH * 1.05);

type PostMediaProps = {
  mediaType: ExplorePostMediaType;
  mediaUri: string;
};

export function PostMedia({ mediaType, mediaUri }: PostMediaProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePress = useCallback(() => {
    if (mediaType !== 'video') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying((prev) => !prev);
  }, [mediaType]);

  const media = (
    <Image
      source={{ uri: mediaUri }}
      style={styles.media}
      contentFit="cover"
      transition={250}
    />
  );

  if (mediaType === 'photo') {
    return <View style={styles.container}>{media}</View>;
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause video preview' : 'Play video preview'}>
      {media}
      <View style={styles.scrim} pointerEvents="none" />
      {isPlaying ? (
        <View style={styles.playingState} pointerEvents="none">
          <View style={styles.playingBadge}>
            <Ionicons name="pause" size={22} color={theme.onEmerald} />
          </View>
          <Text style={styles.playingLabel}>Playing preview</Text>
        </View>
      ) : (
        <View style={styles.playButtonWrap} pointerEvents="none">
          <View style={styles.playButton}>
            <Ionicons name="play" size={28} color={theme.onEmerald} style={styles.playIcon} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      width: SCREEN_WIDTH,
      height: MEDIA_HEIGHT,
      backgroundColor: theme.surfaceElevated,
    },
    containerPressed: {
      opacity: 0.96,
    },
    media: {
      width: '100%',
      height: '100%',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.imageScrimSubtle,
    },
    playButtonWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.imageControlBg,
      borderWidth: 1,
      borderColor: theme.imageControlBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playIcon: {
      marginLeft: 4,
    },
    playingState: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    playingBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.emerald,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowButton,
    },
    playingLabel: {
      color: theme.onEmerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
      backgroundColor: theme.imageControlBg,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: 'hidden',
    },
  });
}
