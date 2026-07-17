export type ExplorePostMediaType = 'photo' | 'video';

export type ExplorePost = {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo: string;
  category: string;
  distance: string;
  distanceMiles: number;
  verified?: boolean;
  initiallyFollowed: boolean;
  mediaType: ExplorePostMediaType;
  mediaUri: string;
  caption: string;
  postedAt: string;
  likeCount: number;
  commentCount: number;
};

export const MAX_NEARBY_DISTANCE_MILES = 15;

export const EXPLORE_POSTS: ExplorePost[] = [
  {
    id: 'explore-1',
    businessId: 'casa-luna-tacos',
    businessName: 'Casa Luna Tacos',
    businessLogo:
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80&auto=format&fit=crop',
    category: 'Mexican Restaurant',
    distance: '1.4 mi',
    distanceMiles: 1.4,
    verified: true,
    initiallyFollowed: true,
    mediaType: 'video',
    mediaUri:
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200&q=80&auto=format&fit=crop',
    caption:
      'Birria is ready. Fresh tortillas, slow-cooked beef, and consommé made this morning.',
    postedAt: '2h ago',
    likeCount: 284,
    commentCount: 41,
  },
  {
    id: 'explore-2',
    businessId: 'eastside-vintage',
    businessName: 'Eastside Vintage',
    businessLogo:
      'https://images.unsplash.com/photo-1441986300917-64676bd846d1?w=200&q=80&auto=format&fit=crop',
    category: 'Vintage Clothing',
    distance: '3.2 mi',
    distanceMiles: 3.2,
    initiallyFollowed: true,
    mediaType: 'photo',
    mediaUri:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80&auto=format&fit=crop',
    caption: 'New jackets just landed. Every piece is one of one.',
    postedAt: '4h ago',
    likeCount: 156,
    commentCount: 18,
  },
  {
    id: 'explore-3',
    businessId: 'marisols-tamales',
    businessName: "Marisol's Tamales",
    businessLogo:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&q=80&auto=format&fit=crop',
    category: 'Food Stand',
    distance: '3.1 mi',
    distanceMiles: 3.1,
    verified: true,
    initiallyFollowed: true,
    mediaType: 'photo',
    mediaUri:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1200&q=80&auto=format&fit=crop',
    caption:
      'Red pork, green chicken, and sweet corn tamales available until sold out.',
    postedAt: '5h ago',
    likeCount: 312,
    commentCount: 52,
  },
  {
    id: 'explore-4',
    businessId: 'beanie-coffee-co',
    businessName: 'Beanie Coffee Co.',
    businessLogo:
      'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=200&q=80&auto=format&fit=crop',
    category: 'Coffee Shop',
    distance: '0.8 mi',
    distanceMiles: 0.8,
    verified: true,
    initiallyFollowed: true,
    mediaType: 'photo',
    mediaUri:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop',
    caption: 'New single-origin pour-over on the bar today. Notes of citrus and honey.',
    postedAt: '6h ago',
    likeCount: 198,
    commentCount: 24,
  },
  {
    id: 'explore-5',
    businessId: 'south-bay-records',
    businessName: 'South Bay Records',
    businessLogo:
      'https://images.unsplash.com/photo-1619983081563-430f63602706?w=200&q=80&auto=format&fit=crop',
    category: 'Record Store',
    distance: '5.6 mi',
    distanceMiles: 5.6,
    initiallyFollowed: false,
    mediaType: 'video',
    mediaUri:
      'https://images.unsplash.com/photo-1619983081563-430f63602706?w=1200&q=80&auto=format&fit=crop',
    caption: 'Fresh crate just dropped — jazz, soul, and local pressings all week.',
    postedAt: '8h ago',
    likeCount: 89,
    commentCount: 11,
  },
  {
    id: 'explore-6',
    businessId: 'bloom-stem-florals',
    businessName: 'Bloom & Stem Florals',
    businessLogo:
      'https://images.unsplash.com/photo-1487530811647-569962357165?w=200&q=80&auto=format&fit=crop',
    category: 'Florist',
    distance: '7.2 mi',
    distanceMiles: 7.2,
    verified: true,
    initiallyFollowed: false,
    mediaType: 'photo',
    mediaUri:
      'https://images.unsplash.com/photo-1487530811647-569962357165?w=1200&q=80&auto=format&fit=crop',
    caption: 'Spring market bouquets are in — peonies, ranunculus, and wild greenery.',
    postedAt: '10h ago',
    likeCount: 241,
    commentCount: 29,
  },
  {
    id: 'explore-7',
    businessId: 'harbor-books',
    businessName: 'Harbor Books',
    businessLogo:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=80&auto=format&fit=crop',
    category: 'Bookstore',
    distance: '4.5 mi',
    distanceMiles: 4.5,
    initiallyFollowed: false,
    mediaType: 'photo',
    mediaUri:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop',
    caption: 'Staff picks table is refreshed — come browse before the weekend rush.',
    postedAt: '12h ago',
    likeCount: 127,
    commentCount: 15,
  },
  {
    id: 'explore-8',
    businessId: 'neighborhood-pizza-co',
    businessName: 'Neighborhood Pizza Co.',
    businessLogo:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80&auto=format&fit=crop',
    category: 'Pizza',
    distance: '8.9 mi',
    distanceMiles: 8.9,
    verified: true,
    initiallyFollowed: false,
    mediaType: 'video',
    mediaUri:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80&auto=format&fit=crop',
    caption: 'Behind the oven tonight — fermented dough, fresh basil, and a perfect char.',
    postedAt: 'Yesterday',
    likeCount: 402,
    commentCount: 63,
  },
  {
    id: 'explore-9',
    businessId: 'beanie-coffee-co',
    businessName: 'Beanie Coffee Co.',
    businessLogo:
      'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=200&q=80&auto=format&fit=crop',
    category: 'Coffee Shop',
    distance: '0.8 mi',
    distanceMiles: 0.8,
    verified: true,
    initiallyFollowed: true,
    mediaType: 'video',
    mediaUri:
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80&auto=format&fit=crop',
    caption: 'Morning rush from the bar — latte art, fresh pastries, and good conversation.',
    postedAt: 'Yesterday',
    likeCount: 176,
    commentCount: 22,
  },
  {
    id: 'explore-10',
    businessId: 'south-bay-records',
    businessName: 'South Bay Records',
    businessLogo:
      'https://images.unsplash.com/photo-1619983081563-430f63602706?w=200&q=80&auto=format&fit=crop',
    category: 'Record Store',
    distance: '5.6 mi',
    distanceMiles: 5.6,
    initiallyFollowed: false,
    mediaType: 'photo',
    mediaUri:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80&auto=format&fit=crop',
    caption: 'In-store listening session this Saturday — bring a friend, stay for the B-sides.',
    postedAt: '2d ago',
    likeCount: 64,
    commentCount: 8,
  },
];

export function getInitiallyFollowedBusinessIds(): Set<string> {
  const ids = EXPLORE_POSTS.filter((post) => post.initiallyFollowed).map(
    (post) => post.businessId,
  );
  return new Set(ids);
}

export type ExploreSegment = 'nearby' | 'following';

export function filterExplorePosts(
  segment: ExploreSegment,
  followedBusinessIds: Set<string>,
): ExplorePost[] {
  if (segment === 'nearby') {
    return EXPLORE_POSTS.filter(
      (post) => post.distanceMiles <= MAX_NEARBY_DISTANCE_MILES,
    );
  }

  return EXPLORE_POSTS.filter((post) => followedBusinessIds.has(post.businessId));
}
