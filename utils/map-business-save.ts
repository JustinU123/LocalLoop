import type { Business } from '@/data/businesses';
import type { MapBusinessWithDistance } from '@/utils/map-filters';

export function mapBusinessWithDistanceToSavedBusiness(business: MapBusinessWithDistance): Business {
  const id = business.profileId ?? business.id;
  const image = business.image?.trim() || business.logo?.trim() || '';

  return {
    id,
    name: business.name,
    category: business.category,
    distance: business.distanceLabel,
    rating: business.rating,
    reviewCount: business.reviewCount,
    followerCount: 0,
    latitude: business.latitude,
    longitude: business.longitude,
    image,
    logo: image,
    cover: image,
    verified: business.isLocalLoopMember,
    isOpen: false,
    phone: '',
    website: '',
    address: [
      business.streetAddress?.trim(),
      business.city?.trim(),
      business.state?.trim(),
      business.postalCode?.trim(),
    ]
      .filter(Boolean)
      .join(', '),
    about: business.description ?? '',
    hours: '',
    photos: image ? [image] : [],
    videos: [],
    posts: [],
    promotions: [],
    events: [],
    menu: [],
    reviews: [],
  };
}
