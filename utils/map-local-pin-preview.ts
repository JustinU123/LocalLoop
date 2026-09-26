import type { MapLocalPinWithDistance } from '@/types/map-pin';
import type { MapBusinessWithDistance } from '@/utils/map-filters';

/** Strip discriminant for legacy LocalLoop map preview / save helpers. */
export function toMapBusinessWithDistance(pin: MapLocalPinWithDistance): MapBusinessWithDistance {
  const { kind: _kind, ...business } = pin;
  return business;
}
