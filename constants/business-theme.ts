export const Brand = {
  bg: '#080808',
  offWhite: '#F5F5F5',
  emerald: '#00C38E',
  coral: '#FF6B4D',
  gray: '#A0A0A0',
  surface: '#111111',
  surfaceElevated: '#161616',
  border: '#222222',
  borderLight: '#2A2A2A',
  star: '#F5C542',
  danger: '#FF6B4D',
  onEmerald: '#FFFFFF',
  onCoral: '#FFFFFF',
  emeraldGlow: 'rgba(0, 195, 142, 0.14)',
  coralGlow: 'rgba(255, 107, 77, 0.14)',
} as const;

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

export const BrandShadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
} as const;

/** Backward-compatible alias used across existing screens. */
export const BusinessTheme = {
  bg: Brand.bg,
  surface: Brand.surface,
  surfaceElevated: Brand.surfaceElevated,
  border: Brand.border,
  borderLight: Brand.borderLight,
  text: Brand.offWhite,
  textSecondary: Brand.gray,
  textMuted: '#707070',
  emerald: Brand.emerald,
  coral: Brand.coral,
  emeraldDark: '#00A374',
  emeraldGlow: Brand.emeraldGlow,
  coralGlow: Brand.coralGlow,
  star: Brand.star,
  danger: Brand.danger,
  onEmerald: Brand.onEmerald,
  onCoral: Brand.onCoral,
};
