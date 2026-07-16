import type { ViewStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

export const BrandFonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export const BrandRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

const shared = {
  emerald: '#00C38E',
  coral: '#FF6B4D',
  star: '#F5C542',
  danger: '#E05555',
  closed: '#6B6B6B',
  onEmerald: '#FFFFFF',
  onCoral: '#FFFFFF',
  onImageMuted: '#D1D5DB',
  emeraldDark: '#00A374',
  emeraldGlow: 'rgba(0, 195, 142, 0.14)',
  coralGlow: 'rgba(255, 107, 77, 0.14)',
  imageScrim: 'rgba(0,0,0,0.22)',
  imageScrimHeavy: 'rgba(0,0,0,0.45)',
  imageScrimLight: 'rgba(0,0,0,0.12)',
  imageScrimMedium: 'rgba(0,0,0,0.28)',
  imageScrimSubtle: 'rgba(0,0,0,0.18)',
  imageControlBg: 'rgba(0,0,0,0.45)',
  imageControlBorder: 'rgba(255,255,255,0.18)',
  imageControlBorderStrong: 'rgba(255,255,255,0.25)',
  closedBadgeBg: 'rgba(107, 107, 107, 0.16)',
} as const;

const lightShadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  } satisfies ViewStyle,
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
};

const darkShadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  } satisfies ViewStyle,
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  } satisfies ViewStyle,
};

export type AppThemeTokens = {
  scheme: ColorScheme;
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  onImage: string;
  onImageMuted: string;
  imageScrim: string;
  imageScrimHeavy: string;
  imageScrimLight: string;
  imageScrimMedium: string;
  imageScrimSubtle: string;
  imageControlBg: string;
  imageControlBorder: string;
  imageControlBorderStrong: string;
  closedBadgeBg: string;
  emerald: string;
  coral: string;
  emeraldDark: string;
  emeraldGlow: string;
  coralGlow: string;
  star: string;
  danger: string;
  closed: string;
  onEmerald: string;
  onCoral: string;
  shadowCard: ViewStyle;
  shadowButton: ViewStyle;
};

export const lightTheme: AppThemeTokens = {
  scheme: 'light',
  isDark: false,
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F8F8',
  surfaceElevated: '#F8F8F8',
  border: '#E8E8E8',
  borderLight: '#E8E8E8',
  text: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#6B7280',
  onImage: '#FFFFFF',
  ...shared,
  shadowCard: lightShadows.card,
  shadowButton: lightShadows.button,
};

export const darkTheme: AppThemeTokens = {
  scheme: 'dark',
  isDark: true,
  bg: '#080808',
  surface: '#121212',
  surfaceSecondary: '#111111',
  surfaceElevated: '#181818',
  border: '#222222',
  borderLight: '#2A2A2A',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textMuted: '#A0A0A0',
  onImage: '#FFFFFF',
  ...shared,
  shadowCard: darkShadows.card,
  shadowButton: darkShadows.button,
};

export function getThemeTokens(scheme: ColorScheme): AppThemeTokens {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

/** @deprecated Use `useAppTheme().theme` for scheme-aware tokens. */
export const Brand = {
  bg: darkTheme.bg,
  offWhite: darkTheme.text,
  emerald: shared.emerald,
  coral: shared.coral,
  gray: darkTheme.textSecondary,
  surface: darkTheme.surface,
  surfaceElevated: darkTheme.surfaceElevated,
  border: darkTheme.border,
  borderLight: darkTheme.borderLight,
  star: shared.star,
  danger: shared.danger,
  closed: shared.closed,
  onEmerald: shared.onEmerald,
  onCoral: shared.onCoral,
  emeraldGlow: shared.emeraldGlow,
  coralGlow: shared.coralGlow,
} as const;

/** @deprecated Use `useAppTheme().theme` for scheme-aware tokens. */
export const BrandShadow = {
  card: darkShadows.card,
  button: darkShadows.button,
} as const;

/** @deprecated Use `useAppTheme().theme` for scheme-aware tokens. */
export const BusinessTheme = {
  bg: darkTheme.bg,
  surface: darkTheme.surface,
  surfaceElevated: darkTheme.surfaceElevated,
  border: darkTheme.border,
  borderLight: darkTheme.borderLight,
  text: darkTheme.text,
  textSecondary: darkTheme.textSecondary,
  textMuted: darkTheme.textMuted,
  emerald: shared.emerald,
  coral: shared.coral,
  emeraldDark: shared.emeraldDark,
  emeraldGlow: shared.emeraldGlow,
  coralGlow: shared.coralGlow,
  star: shared.star,
  danger: shared.danger,
  closed: shared.closed,
  onEmerald: shared.onEmerald,
  onCoral: shared.onCoral,
};
