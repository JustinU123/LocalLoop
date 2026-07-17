export type MapBusinessCategory =
  | 'all'
  | 'food'
  | 'coffee'
  | 'clothing'
  | 'bakery'
  | 'markets'
  | 'beauty'
  | 'books'
  | 'florists'
  | 'fitness'
  | 'other';

export type MapBusiness = {
  id: string;
  profileId?: string;
  name: string;
  category: string;
  mapCategory: MapBusinessCategory;
  keywords: string[];
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  image: string;
  logo: string;
  isLocalLoopMember: boolean;
  isChain: boolean;
  hasPromotion: boolean;
  isOpen: boolean;
  description?: string;
};

export const DEFAULT_MAP_CENTER = {
  latitude: 34.0522,
  longitude: -118.2437,
};

export const MAP_BUSINESSES: MapBusiness[] = [
  {
    id: 'map-casa-luna',
    profileId: 'casa-luna-tacos',
    name: 'Casa Luna Tacos',
    category: 'Mexican Restaurant',
    mapCategory: 'food',
    keywords: ['tacos', 'birria', 'mexican', 'food', 'restaurant'],
    latitude: 34.0842,
    longitude: -118.3055,
    rating: 4.9,
    reviewCount: 512,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: true,
    isOpen: true,
  },
  {
    id: 'map-marisols',
    profileId: 'marisols-tamales',
    name: "Marisol's Tamales",
    category: 'Food Stand',
    mapCategory: 'food',
    keywords: ['tamales', 'mexican', 'food', 'street food'],
    latitude: 34.0522,
    longitude: -118.2737,
    rating: 4.9,
    reviewCount: 267,
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-beanie',
    profileId: 'beanie-coffee-co',
    name: 'Beanie Coffee Co.',
    category: 'Coffee Shop',
    mapCategory: 'coffee',
    keywords: ['coffee', 'espresso', 'latte', 'cafe', 'bakery'],
    latitude: 34.0912,
    longitude: -118.2811,
    rating: 4.8,
    reviewCount: 326,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: true,
    isOpen: true,
  },
  {
    id: 'map-eastside',
    profileId: 'eastside-vintage',
    name: 'Eastside Vintage',
    category: 'Vintage Clothing',
    mapCategory: 'clothing',
    keywords: ['clothing', 'vintage', 'jackets', 'fashion', 'thrift'],
    latitude: 34.0785,
    longitude: -118.2214,
    rating: 4.6,
    reviewCount: 198,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1441986300917-64676bd846d1?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: true,
    isOpen: true,
  },
  {
    id: 'map-harbor-books',
    profileId: 'harbor-books',
    name: 'Harbor Books',
    category: 'Bookstore',
    mapCategory: 'books',
    keywords: ['books', 'bookstore', 'reading', 'indie', 'authors'],
    latitude: 33.8439,
    longitude: -118.3414,
    rating: 4.8,
    reviewCount: 174,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-bloom-stem',
    profileId: 'bloom-stem-florals',
    name: 'Bloom & Stem Florals',
    category: 'Florist',
    mapCategory: 'florists',
    keywords: ['florist', 'flowers', 'bouquet', 'florals', 'gifts'],
    latitude: 34.0195,
    longitude: -118.4912,
    rating: 4.9,
    reviewCount: 203,
    image: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: true,
    isOpen: true,
  },
  {
    id: 'map-south-bay-records',
    profileId: 'south-bay-records',
    name: 'South Bay Records',
    category: 'Record Store',
    mapCategory: 'other',
    keywords: ['records', 'vinyl', 'music', 'shop'],
    latitude: 33.8817,
    longitude: -118.2915,
    rating: 4.7,
    reviewCount: 118,
    image: 'https://images.unsplash.com/photo-1619983081563-430f63602706?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1619983081563-430f63602706?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-neighborhood-pizza',
    profileId: 'neighborhood-pizza-co',
    name: 'Neighborhood Pizza Co.',
    category: 'Pizza',
    mapCategory: 'food',
    keywords: ['pizza', 'food', 'slice', 'italian'],
    latitude: 34.0407,
    longitude: -118.4412,
    rating: 4.6,
    reviewCount: 438,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: true,
    isChain: false,
    hasPromotion: true,
    isOpen: true,
  },
  {
    id: 'map-family-bakery',
    name: 'Family Bakery',
    category: 'Bakery',
    mapCategory: 'bakery',
    keywords: ['bakery', 'bread', 'pastry', 'croissant', 'breakfast'],
    latitude: 34.0689,
    longitude: -118.2651,
    rating: 4.7,
    reviewCount: 142,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: false,
    isChain: false,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-local-market',
    name: 'Local Market',
    category: 'Neighborhood Market',
    mapCategory: 'markets',
    keywords: ['market', 'grocery', 'produce', 'local', 'farmers'],
    latitude: 34.0621,
    longitude: -118.3288,
    rating: 4.5,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: false,
    isChain: false,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-independent-barber',
    name: 'Independent Barber',
    category: 'Barber Shop',
    mapCategory: 'beauty',
    keywords: ['barber', 'haircut', 'beauty', 'grooming', 'salon'],
    latitude: 34.1011,
    longitude: -118.2912,
    rating: 4.8,
    reviewCount: 96,
    image: 'https://images.unsplash.com/photo-1503951914875-1628590461749?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1503951914875-1628590461749?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: false,
    isChain: false,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-community-fitness',
    name: 'Community Fitness Studio',
    category: 'Fitness Studio',
    mapCategory: 'fitness',
    keywords: ['fitness', 'yoga', 'gym', 'workout', 'studio'],
    latitude: 34.0489,
    longitude: -118.2562,
    rating: 4.6,
    reviewCount: 121,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: false,
    isChain: false,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-starbucks',
    name: 'Starbucks',
    category: 'Coffee Chain',
    mapCategory: 'coffee',
    keywords: ['coffee', 'chain', 'starbucks', 'cafe'],
    latitude: 34.0736,
    longitude: -118.2401,
    rating: 4.1,
    reviewCount: 890,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: false,
    isChain: true,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-chipotle',
    name: 'Chipotle',
    category: 'Fast Casual Chain',
    mapCategory: 'food',
    keywords: ['chipotle', 'burrito', 'chain', 'food', 'mexican'],
    latitude: 34.0775,
    longitude: -118.2612,
    rating: 4.0,
    reviewCount: 1204,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: false,
    isChain: true,
    hasPromotion: false,
    isOpen: true,
  },
  {
    id: 'map-target',
    name: 'Target',
    category: 'National Retail Chain',
    mapCategory: 'markets',
    keywords: ['target', 'retail', 'chain', 'shopping'],
    latitude: 34.0385,
    longitude: -118.2734,
    rating: 4.2,
    reviewCount: 2100,
    image: 'https://images.unsplash.com/photo-1441986300917-64676bd846d1?w=600&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1441986300917-64676bd846d1?w=200&q=80&auto=format&fit=crop',
    isLocalLoopMember: false,
    isChain: true,
    hasPromotion: false,
    isOpen: true,
  },
];

export const MAP_CATEGORY_OPTIONS: { id: MapBusinessCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'markets', label: 'Markets' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'books', label: 'Books' },
  { id: 'florists', label: 'Florists' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'other', label: 'Other' },
];

export const MAP_DISTANCE_OPTIONS = [1, 5, 10, 15, 25, 50] as const;

export type MapDistanceOption = (typeof MAP_DISTANCE_OPTIONS)[number];

const MAP_BUSINESS_DESCRIPTIONS: Record<string, string> = {
  'map-casa-luna': 'Fresh birria, handmade tortillas, and consommé made daily.',
  'map-marisols': 'Red pork, green chicken, and sweet corn tamales until sold out.',
  'map-beanie': 'Free pastry with any large drink this week.',
  'map-eastside': 'New one-of-one jackets just landed on the rack.',
  'map-harbor-books': 'Staff picks refreshed — browse before the weekend rush.',
  'map-bloom-stem': 'Spring market bouquets with peonies and wild greenery.',
  'map-south-bay-records': 'Fresh crate of jazz, soul, and local pressings.',
  'map-neighborhood-pizza': 'Wood-fired pies with fermented dough and seasonal toppings.',
  'map-family-bakery': 'Buttery croissants and sourdough loaves baked every morning.',
  'map-local-market': 'Neighborhood produce, pantry staples, and local goods.',
  'map-independent-barber': 'Walk-ins welcome for classic cuts and straight-razor shaves.',
  'map-community-fitness': 'Community classes for yoga, strength, and mobility.',
};

export function getMapBusinessDescription(business: MapBusiness): string {
  return (
    business.description ??
    MAP_BUSINESS_DESCRIPTIONS[business.id] ??
    `Discover ${business.name} nearby on LocalLoop.`
  );
}
