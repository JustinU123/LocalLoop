export type Promotion = {
  id: string;
  businessName: string;
  businessLogo: string;
  promotionImage: string;
  title: string;
  description: string;
  distance: string;
  distanceMiles: number;
  expiresLabel: string;
  verified?: boolean;
  localFavorite?: boolean;
};

export const FOLLOWING_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-following-1',
    businessName: 'Beanie Coffee Co.',
    businessLogo:
      'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80&auto=format&fit=crop',
    title: 'Free pastry with any large drink',
    description: 'Start your morning with a fresh pastry on us when you order any large coffee drink.',
    distance: '0.8 miles away',
    distanceMiles: 0.8,
    expiresLabel: 'Ends today',
    verified: true,
    localFavorite: true,
  },
  {
    id: 'promo-following-2',
    businessName: 'Eastside Vintage',
    businessLogo:
      'https://images.unsplash.com/photo-1441986300917-64676bd846d1?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=80&auto=format&fit=crop',
    title: '20% off all jackets this weekend',
    description: 'Refresh your wardrobe with curated vintage outerwear at a special weekend rate.',
    distance: '3.2 miles away',
    distanceMiles: 3.2,
    expiresLabel: 'Ends Sunday',
    localFavorite: true,
  },
  {
    id: 'promo-following-3',
    businessName: 'Casa Luna Tacos',
    businessLogo:
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=900&q=80&auto=format&fit=crop',
    title: 'Buy 2 tacos, get 1 free',
    description: 'Mix and match any street tacos from the evening menu and enjoy a third on the house.',
    distance: '1.4 miles away',
    distanceMiles: 1.4,
    expiresLabel: 'Ends in 2 days',
    verified: true,
  },
];

export const NEARBY_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-nearby-1',
    businessName: 'Harbor Pizza Co.',
    businessLogo:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=80&auto=format&fit=crop',
    title: '$5 off any large pizza',
    description: 'Neighborhood slice shop special — valid for dine-in and pickup orders tonight only.',
    distance: '0.5 miles away',
    distanceMiles: 0.5,
    expiresLabel: 'Ends tonight',
    verified: true,
  },
  {
    id: 'promo-nearby-2',
    businessName: 'Sunny Side Bakery',
    businessLogo:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80&auto=format&fit=crop',
    title: '15% off morning bundles',
    description: 'Grab a coffee, pastry, and fruit cup bundle before 11 AM and save on your breakfast run.',
    distance: '2.1 miles away',
    distanceMiles: 2.1,
    expiresLabel: 'Ends tomorrow',
    localFavorite: true,
  },
  {
    id: 'promo-nearby-3',
    businessName: 'River Run Books',
    businessLogo:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80&auto=format&fit=crop',
    title: 'Buy one, get one half off',
    description: 'Mix new releases and staff picks — second book is half price all week long.',
    distance: '4.5 miles away',
    distanceMiles: 4.5,
    expiresLabel: 'Ends Friday',
  },
  {
    id: 'promo-nearby-4',
    businessName: 'Bloom Florist',
    businessLogo:
      'https://images.unsplash.com/photo-1487530811647-569962357165?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1487530811647-569962357165?w=900&q=80&auto=format&fit=crop',
    title: 'Free delivery on orders $40+',
    description: 'Send locally grown arrangements across town with complimentary same-day delivery.',
    distance: '6.7 miles away',
    distanceMiles: 6.7,
    expiresLabel: 'Ends in 3 days',
    verified: true,
    localFavorite: true,
  },
  {
    id: 'promo-nearby-5',
    businessName: 'Green Leaf Yoga',
    businessLogo:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=80&auto=format&fit=crop',
    title: 'First class free for new students',
    description: 'Try any community flow or restorative session on the house — mat rental included.',
    distance: '8.2 miles away',
    distanceMiles: 8.2,
    expiresLabel: 'Ends in 5 days',
    localFavorite: true,
  },
  {
    id: 'promo-nearby-6',
    businessName: 'Mile High Records',
    businessLogo:
      'https://images.unsplash.com/photo-1619983081563-430f63602706?w=200&q=80&auto=format&fit=crop',
    promotionImage:
      'https://images.unsplash.com/photo-1619983081563-430f63602706?w=900&q=80&auto=format&fit=crop',
    title: '10% off all vinyl this week',
    description: 'Dig through new arrivals and local pressings with a limited-time crate-digger discount.',
    distance: '12.3 miles away',
    distanceMiles: 12.3,
    expiresLabel: 'Ends Saturday',
  },
];

export const RADIUS_OPTIONS = [1, 5, 10, 15, 25, 50] as const;

export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

export const DEFAULT_RADIUS: RadiusOption = 10;
