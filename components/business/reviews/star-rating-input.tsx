import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessReviewRating } from '@/types/supabase-review';

type StarRatingInputProps = {
  value: BusinessReviewRating | null;
  onChange: (rating: BusinessReviewRating) => void;
  size?: number;
};

export function StarRatingInput({ value, onChange, size = 36 }: StarRatingInputProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <View style={styles.row}>
      {([1, 2, 3, 4, 5] as const).map((star) => {
        const filled = value != null && star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(star);
            }}
            hitSlop={6}
            style={({ pressed }) => [styles.starButton, pressed && styles.starPressed]}>
            <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={theme.star} />
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    starButton: {
      padding: 4,
    },
    starPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
  });
}
