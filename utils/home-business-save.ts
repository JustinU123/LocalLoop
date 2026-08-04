import type { Business } from '@/data/businesses';
import type { HomeBusiness } from '@/types/home-business';
import { formatHomeBusinessLocation } from '@/services/homeBusinesses';

export function homeBusinessToSavedBusiness(business: HomeBusiness): Business {
  const location = formatHomeBusinessLocation(business);
  const image = business.coverImageUrl ?? '';

  return {
    id: business.id,
    name: business.name,
    category: business.category,
    distance: '',
    rating: 0,
    reviewCount: 0,
    followerCount: 0,
    latitude: 0,
    longitude: 0,
    image,
    logo: image,
    cover: image,
    verified: true,
    isOpen: true,
    phone: '',
    website: '',
    address: location ?? '',
    about: business.description ?? '',
    hours: '',
    photos: image ? [image] : [],
    videos: [],
    posts: [],
    promotions: [],
    menu: [],
    reviews: [],
  };
}
