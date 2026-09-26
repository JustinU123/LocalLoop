import type { MapBusiness } from '@/data/map-businesses';
import type { MapLocalPin } from '@/types/map-pin';

/** Maps Supabase-backed MapBusiness rows to discriminated local pins. */
export function toMapLocalPin(business: MapBusiness): MapLocalPin {
  return {
    kind: 'localloop',
    id: business.id,
    profileId: business.profileId ?? business.id,
    name: business.name,
    category: business.category,
    mapCategory: business.mapCategory,
    keywords: business.keywords,
    latitude: business.latitude,
    longitude: business.longitude,
    rating: business.rating,
    reviewCount: business.reviewCount,
    image: business.image,
    logo: business.logo,
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: business.hasPromotion,
    isOpen: business.isOpen,
    description: business.description,
    streetAddress: business.streetAddress,
    city: business.city,
    state: business.state,
    postalCode: business.postalCode,
  };
}

export function toMapLocalPins(businesses: MapBusiness[]): MapLocalPin[] {
  return businesses.map(toMapLocalPin);
}
