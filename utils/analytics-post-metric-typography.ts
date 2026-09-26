import type { TextStyle } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';

/** Typography for metric values inside Content post-row chips (Basic / Pro / Premium). */
export function analyticsPostMetricTextStyle(theme: AppThemeTokens): TextStyle {
  return {
    color: theme.textSecondary,
    fontSize: 13,
    fontFamily: BrandFonts.semiBold,
  };
}
