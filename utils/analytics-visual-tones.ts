import type { AppThemeTokens } from '@/constants/business-theme';

export type AnalyticsVisualTone = 'emerald' | 'coral' | 'amber' | 'gold' | 'teal' | 'blue';

export function getAnalyticsVisualTone(
  theme: AppThemeTokens,
  tone: AnalyticsVisualTone,
): { foreground: string; background: string; border: string } {
  switch (tone) {
    case 'coral':
      return {
        foreground: theme.coral,
        background: theme.coralGlow,
        border: 'rgba(255, 107, 77, 0.35)',
      };
    case 'amber':
      return {
        foreground: theme.star,
        background: 'rgba(245, 197, 66, 0.2)',
        border: 'rgba(245, 197, 66, 0.35)',
      };
    case 'gold':
      return {
        foreground: theme.star,
        background: 'rgba(245, 197, 66, 0.14)',
        border: 'rgba(245, 197, 66, 0.28)',
      };
    case 'teal':
      return {
        foreground: theme.emeraldDark,
        background: theme.emeraldGlow,
        border: 'rgba(0, 163, 116, 0.35)',
      };
    case 'blue':
      return {
        foreground: theme.isDark ? '#7DD3FC' : '#0284C7',
        background: theme.isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(14, 165, 233, 0.12)',
        border: 'rgba(14, 165, 233, 0.32)',
      };
    default:
      return {
        foreground: theme.emerald,
        background: theme.emeraldGlow,
        border: 'rgba(0, 195, 142, 0.35)',
      };
  }
}
