import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getThemeTokens,
  type AppThemeTokens,
  type ColorScheme,
  type ThemePreference,
} from '@/constants/business-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getThemePreference, setThemePreference } from '@/utils/theme-storage';

type AppThemeContextValue = {
  theme: AppThemeTokens;
  preference: ThemePreference;
  resolvedScheme: ColorScheme;
  isReady: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    getThemePreference().then((stored) => {
      if (mounted) {
        setPreferenceState(stored);
        setIsReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedScheme: ColorScheme = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const theme = useMemo(() => getThemeTokens(resolvedScheme), [resolvedScheme]);

  useEffect(() => {
    if (!isReady) return;
    SystemUI.setBackgroundColorAsync(theme.bg).catch(() => undefined);
  }, [isReady, theme.bg]);

  const setPreference = useCallback(async (next: ThemePreference) => {
    await setThemePreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      preference,
      resolvedScheme,
      isReady,
      setPreference,
    }),
    [theme, preference, resolvedScheme, isReady, setPreference],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
}
