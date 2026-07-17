import { View } from 'react-native';

import { useAppTheme } from '@/contexts/app-theme-context';
import type { MapBusiness } from '@/data/map-businesses';

const MARKER_HIT_SIZE = 44;
const MARKER_DOT_SIZE = 18;
const MARKER_DOT_SELECTED_SIZE = 22;

type MapBusinessMarkerProps = {
  business: MapBusiness;
  selected?: boolean;
};

export function MapBusinessMarker({ business, selected = false }: MapBusinessMarkerProps) {
  const { theme } = useAppTheme();

  const fill = business.hasPromotion
    ? theme.coral
    : business.isLocalLoopMember
      ? theme.emerald
      : theme.textSecondary;

  const ring = selected ? theme.text : business.hasPromotion ? theme.coral : theme.emerald;
  const dotSize = selected ? MARKER_DOT_SELECTED_SIZE : MARKER_DOT_SIZE;

  return (
    <View
      style={{
        width: MARKER_HIT_SIZE,
        height: MARKER_HIT_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: 999,
          backgroundColor: fill,
          borderWidth: selected ? 3 : 2,
          borderColor: ring,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: selected ? 0.35 : 0.25,
          shadowRadius: selected ? 6 : 4,
        }}
      />
      {business.hasPromotion ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.coral,
            borderWidth: 1,
            borderColor: theme.surface,
          }}
        />
      ) : null}
    </View>
  );
}
