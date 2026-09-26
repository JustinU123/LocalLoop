import type { AppThemeTokens } from '@/constants/business-theme';

/** Blue-green visual language for LocalLoop Intelligence (not primary emerald actions). */
export type IntelligenceThemeTokens = {
  foreground: string;
  foregroundMuted: string;
  background: string;
  backgroundElevated: string;
  border: string;
  glow: string;
  gradientTop: string;
  gradientBottom: string;
  onAccent: string;
};

export function getIntelligenceTheme(theme: AppThemeTokens): IntelligenceThemeTokens {
  if (theme.isDark) {
    return {
      foreground: '#5EEAD4',
      foregroundMuted: 'rgba(94, 234, 212, 0.72)',
      background: 'rgba(13, 148, 136, 0.12)',
      backgroundElevated: 'rgba(45, 212, 191, 0.08)',
      border: 'rgba(45, 212, 191, 0.32)',
      glow: 'rgba(20, 184, 166, 0.18)',
      gradientTop: 'rgba(45, 212, 191, 0.14)',
      gradientBottom: 'rgba(13, 148, 136, 0.04)',
      onAccent: '#042F2E',
    };
  }

  return {
    foreground: '#0F766E',
    foregroundMuted: 'rgba(15, 118, 110, 0.75)',
    background: 'rgba(20, 184, 166, 0.1)',
    backgroundElevated: 'rgba(45, 212, 191, 0.12)',
    border: 'rgba(13, 148, 136, 0.28)',
    glow: 'rgba(20, 184, 166, 0.12)',
    gradientTop: 'rgba(45, 212, 191, 0.22)',
    gradientBottom: 'rgba(255, 255, 255, 0)',
    onAccent: '#FFFFFF',
  };
}
