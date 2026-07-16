import { useMemo } from 'react';

import type { AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';

export function useThemedStyles<TStyles>(factory: (theme: AppThemeTokens) => TStyles): TStyles {
  const { theme } = useAppTheme();
  return useMemo(() => factory(theme), [theme]);
}
