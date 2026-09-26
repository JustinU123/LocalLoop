import type { AppThemeTokens } from '@/constants/business-theme';
import type { MapPin } from '@/types/map-pin';
import { isMapChainPin } from '@/types/map-pin';

/** Map pin color for national chains (Places / POI layer — styling only until data ships). */
export const MAP_CHAIN_MARKER_COLOR = '#3B82F6';

export type MapMarkerColorScheme = {
  fill: string;
  ring: string;
  showPromotionDot: boolean;
};

export function getMapMarkerColors(
  pin: MapPin,
  theme: AppThemeTokens,
  selected: boolean,
): MapMarkerColorScheme {
  if (isMapChainPin(pin)) {
    const fill = MAP_CHAIN_MARKER_COLOR;
    return {
      fill,
      ring: selected ? theme.text : fill,
      showPromotionDot: false,
    };
  }

  if (pin.hasPromotion) {
    return {
      fill: theme.coral,
      ring: selected ? theme.text : theme.coral,
      showPromotionDot: true,
    };
  }

  return {
    fill: theme.emerald,
    ring: selected ? theme.text : theme.emerald,
    showPromotionDot: false,
  };
}
