import { StyleSheet, Text, type TextProps } from 'react-native';

import { BrandFonts } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const { theme } = useAppTheme();

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? [styles.link, { color: theme.emerald }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: BrandFonts.regular,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: BrandFonts.semiBold,
  },
  title: {
    fontSize: 32,
    fontFamily: BrandFonts.bold,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: BrandFonts.bold,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontFamily: BrandFonts.medium,
  },
});
