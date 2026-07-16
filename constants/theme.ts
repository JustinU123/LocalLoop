import { Platform } from 'react-native';

import { darkTheme, lightTheme } from '@/constants/business-theme';

const tintColorLight = lightTheme.emerald;
const tintColorDark = darkTheme.emerald;

export const Colors = {
  light: {
    text: lightTheme.text,
    background: lightTheme.bg,
    tint: tintColorLight,
    icon: lightTheme.textSecondary,
    tabIconDefault: lightTheme.textSecondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: darkTheme.text,
    background: darkTheme.bg,
    tint: tintColorDark,
    icon: darkTheme.textSecondary,
    tabIconDefault: darkTheme.textSecondary,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
