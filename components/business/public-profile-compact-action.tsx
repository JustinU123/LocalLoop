import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type PublicProfileCompactActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function PublicProfileCompactAction({ icon, label, onPress }: PublicProfileCompactActionProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}>
      <View style={styles.circle}>
        <Ionicons name={icon} size={17} color={theme.onEmerald} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
      paddingHorizontal: 2,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
    circle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.emerald,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowButton,
    },
    label: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: BrandFonts.semiBold,
      marginTop: 5,
      textAlign: 'center',
    },
  });
}
