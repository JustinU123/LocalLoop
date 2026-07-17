import type {
  Business,
  BusinessPost,
  BusinessPromotionItem,
  BusinessReview,
  BusinessVideo,
  MenuSection,
} from '@/data/businesses';

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop',
];

function buildVideos(cover: string, name: string): BusinessVideo[] {
  return [
    {
      id: 'v1',
      thumbnail: cover,
      caption: `Inside ${name}`,
      views: '6.8K',
      likes: '842',
    },
    {
      id: 'v2',
      thumbnail: cover,
      caption: 'Community favorite this week',
      views: '4.1K',
      likes: '510',
    },
  ];
}

function buildReviews(rating: number): BusinessReview[] {
  return [
    {
      id: 'r1',
      author: 'Maya Chen',
      avatar: AVATARS[0],
      rating,
      date: '3d ago',
      text: 'Exactly the kind of local spot I love supporting. Great vibe and even better service.',
    },
    {
      id: 'r2',
      author: 'Jordan Lee',
      avatar: AVATARS[1],
      rating: Math.max(4, rating - 0.1),
      date: '1w ago',
      text: 'Consistently excellent. Already recommended to friends in the neighborhood.',
    },
  ];
}

function buildPosts(photos: string[], name: string): BusinessPost[] {
  return photos.slice(0, 3).map((image, index) => ({
    id: `post-${index + 1}`,
    image,
    caption: `Highlights from ${name}`,
    postedAt: `${index + 1}d ago`,
  }));
}

type PromotionBusinessSeed = {
  id: string;
  name: string;
  category: string;
  distance: string;
  rating: number;
  reviewCount: number;
  followerCount: number;
  latitude: number;
  longitude: number;
  image: string;
  logo: string;
  cover: string;
  verified?: boolean;
  isOpen?: boolean;
  phone: string;
  website: string;
  address: string;
  about: string;
  hours: string;
  photos: string[];
  promotions: BusinessPromotionItem[];
};

function createPromotionBusiness(seed: PromotionBusinessSeed): Business {
  const menu: MenuSection[] = [];

  return {
    ...seed,
    verified: seed.verified ?? false,
    isOpen: seed.isOpen ?? true,
    videos: buildVideos(seed.image, seed.name),
    menu,
    reviews: buildReviews(seed.rating),
    posts: buildPosts(seed.photos, seed.name),
    promotions: seed.promotions,
  };
}

export const PROMOTION_BUSINESSES: Business[] = [
  createPromotionBusiness({
    id: 'beanie-coffee-co',
    name: 'Beanie Coffee Co.',
    category: 'Coffee',
    distance: '0.8 mi',
    rating: 4.8,
    reviewCount: 326,
    followerCount: 1840,
    latitude: 34.0912,
    longitude: -118.2811,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    phone: '(323) 555-0142',
    website: 'beaniecoffee.co',
    address: '2210 Sunset Blvd, Los Angeles, CA 90026',
    about:
      'Neighborhood specialty coffee bar roasting small-batch beans and serving seasonal pastries in a warm, plant-filled space.',
    hours: 'Daily 7am–6pm',
    photos: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'beanie-promo-1',
        title: 'Free pastry with any large drink',
        description: 'Start your morning with a fresh pastry on us when you order any large coffee drink.',
        expiresLabel: 'Ends today',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'eastside-vintage',
    name: 'Eastside Vintage',
    category: 'Clothing',
    distance: '3.2 mi',
    rating: 4.6,
    reviewCount: 198,
    followerCount: 920,
    latitude: 34.0785,
    longitude: -118.2214,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1441986300917-64676bd846d1?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80&auto=format&fit=crop',
    phone: '(323) 555-0198',
    website: 'eastsidevintage.com',
    address: '4100 Sunset Blvd, Los Angeles, CA 90029',
    about:
      'Curated vintage clothing shop specializing in outerwear, denim, and one-of-a-kind finds from the 70s through the 90s.',
    hours: 'Thu–Sun 11am–7pm',
    photos: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1441986300917-64676bd846d1?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'eastside-promo-1',
        title: '20% off all jackets this weekend',
        description: 'Refresh your wardrobe with curated vintage outerwear at a special weekend rate.',
        expiresLabel: 'Ends Sunday',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'casa-luna-tacos',
    name: 'Casa Luna Tacos',
    category: 'Food',
    distance: '1.4 mi',
    rating: 4.9,
    reviewCount: 512,
    followerCount: 2410,
    latitude: 34.0842,
    longitude: -118.3055,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    phone: '(323) 555-0177',
    website: 'casalunatacos.com',
    address: '1847 Echo Park Ave, Los Angeles, CA 90026',
    about:
      'Family-run taqueria serving handmade tortillas, slow-braised meats, and vibrant salsas late into the evening.',
    hours: 'Tue–Sun 11am–10pm',
    photos: [
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'casa-promo-1',
        title: 'Buy 2 tacos, get 1 free',
        description: 'Mix and match any street tacos from the evening menu and enjoy a third on the house.',
        expiresLabel: 'Ends in 2 days',
        image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'harbor-pizza-co',
    name: 'Harbor Pizza Co.',
    category: 'Food',
    distance: '0.5 mi',
    rating: 4.5,
    reviewCount: 874,
    followerCount: 1320,
    latitude: 34.0522,
    longitude: -118.2437,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    phone: '(213) 555-0110',
    website: 'harborpizza.co',
    address: '512 Main St, Los Angeles, CA 90013',
    about:
      'Neighborhood slice shop with fermented dough, seasonal toppings, and a lively counter for quick pickup.',
    hours: 'Daily 11am–11pm',
    photos: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'harbor-promo-1',
        title: '$5 off any large pizza',
        description: 'Valid for dine-in and pickup orders tonight only.',
        expiresLabel: 'Ends tonight',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'sunny-side-bakery',
    name: 'Sunny Side Bakery',
    category: 'Food',
    distance: '2.1 mi',
    rating: 4.7,
    reviewCount: 421,
    followerCount: 1560,
    latitude: 34.0689,
    longitude: -118.2651,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80&auto=format&fit=crop',
    phone: '(323) 555-0133',
    website: 'sunnysidebakery.com',
    address: '902 Silver Lake Blvd, Los Angeles, CA 90039',
    about:
      'Artisan bakery known for buttery croissants, sourdough loaves, and bright breakfast bundles every morning.',
    hours: 'Daily 6:30am–3pm',
    photos: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'sunny-promo-1',
        title: '15% off morning bundles',
        description: 'Grab a coffee, pastry, and fruit cup bundle before 11 AM and save on your breakfast run.',
        expiresLabel: 'Ends tomorrow',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'river-run-books',
    name: 'River Run Books',
    category: 'Retail',
    distance: '4.5 mi',
    rating: 4.8,
    reviewCount: 156,
    followerCount: 680,
    latitude: 34.1011,
    longitude: -118.2912,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop',
    phone: '(323) 555-0166',
    website: 'riverrunbooks.com',
    address: '3301 Glendale Blvd, Los Angeles, CA 90039',
    about:
      'Independent bookstore with a rotating staff-pick table, local author events, and a cozy reading nook.',
    hours: 'Wed–Sun 10am–7pm',
    photos: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'river-promo-1',
        title: 'Buy one, get one half off',
        description: 'Mix new releases and staff picks — second book is half price all week long.',
        expiresLabel: 'Ends Friday',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'bloom-florist',
    name: 'Bloom Florist',
    category: 'Retail',
    distance: '6.7 mi',
    rating: 4.9,
    reviewCount: 289,
    followerCount: 1120,
    latitude: 34.0621,
    longitude: -118.3288,
    image: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    phone: '(323) 555-0188',
    website: 'bloomflorist.la',
    address: '1450 Vermont Ave, Los Angeles, CA 90006',
    about:
      'Florist studio crafting locally grown arrangements for everyday gifting, events, and seasonal installations.',
    hours: 'Tue–Sat 9am–6pm',
    photos: [
      'https://images.unsplash.com/photo-1487530811647-569962357165?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'bloom-promo-1',
        title: 'Free delivery on orders $40+',
        description: 'Send locally grown arrangements across town with complimentary same-day delivery.',
        expiresLabel: 'Ends in 3 days',
        image: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'green-leaf-yoga',
    name: 'Green Leaf Yoga',
    category: 'Fitness',
    distance: '8.2 mi',
    rating: 4.7,
    reviewCount: 367,
    followerCount: 980,
    latitude: 34.0489,
    longitude: -118.2562,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80&auto=format&fit=crop',
    phone: '(323) 555-0155',
    website: 'greenleafyoga.com',
    address: '2200 West Blvd, Los Angeles, CA 90016',
    about:
      'Community yoga studio offering flow, restorative, and beginner-friendly classes in a light-filled loft space.',
    hours: 'Daily 6am–9pm',
    photos: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'green-promo-1',
        title: 'First class free for new students',
        description: 'Try any community flow or restorative session on the house — mat rental included.',
        expiresLabel: 'Ends in 5 days',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'mile-high-records',
    name: 'Mile High Records',
    category: 'Retail',
    distance: '12.3 mi',
    rating: 4.6,
    reviewCount: 142,
    followerCount: 540,
    latitude: 34.1188,
    longitude: -118.1924,
    image: 'https://images.unsplash.com/photo-1619983081563-430f63602706?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1619983081563-430f63602706?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1619983081563-430f63602706?w=1200&q=80&auto=format&fit=crop',
    phone: '(323) 555-0120',
    website: 'milehighrecords.com',
    address: '6400 York Blvd, Los Angeles, CA 90042',
    about:
      'Vinyl-focused record shop with deep jazz, soul, and local pressings plus in-store listening sessions.',
    hours: 'Fri–Sun 12pm–8pm',
    photos: [
      'https://images.unsplash.com/photo-1619983081563-430f63602706?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [
      {
        id: 'mile-promo-1',
        title: '10% off all vinyl this week',
        description: 'Dig through new arrivals and local pressings with a limited-time crate-digger discount.',
        expiresLabel: 'Ends Saturday',
        image: 'https://images.unsplash.com/photo-1619983081563-430f63602706?w=900&q=80&auto=format&fit=crop',
      },
    ],
  }),
  createPromotionBusiness({
    id: 'south-bay-records',
    name: 'South Bay Records',
    category: 'Record Store',
    distance: '5.6 mi',
    rating: 4.7,
    reviewCount: 118,
    followerCount: 620,
    latitude: 33.8817,
    longitude: -118.2915,
    image: 'https://images.unsplash.com/photo-1619983081563-430f63602706?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1619983081563-430f63602706?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80&auto=format&fit=crop',
    phone: '(310) 555-0144',
    website: 'southbayrecords.com',
    address: '412 Pier Ave, Hermosa Beach, CA 90254',
    about:
      'Independent record shop with curated new arrivals, used gems, and weekly in-store listening nights.',
    hours: 'Wed–Sun 11am–7pm',
    photos: [
      'https://images.unsplash.com/photo-1619983081563-430f63602706?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [],
  }),
  createPromotionBusiness({
    id: 'bloom-stem-florals',
    name: 'Bloom & Stem Florals',
    category: 'Florist',
    distance: '7.2 mi',
    rating: 4.9,
    reviewCount: 203,
    followerCount: 890,
    latitude: 34.0195,
    longitude: -118.4912,
    image: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1487530811647-569962357165?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    phone: '(310) 555-0199',
    website: 'bloomandstem.la',
    address: '1802 Main St, Santa Monica, CA 90401',
    about:
      'Boutique florist studio crafting seasonal bouquets, event installations, and locally grown arrangements.',
    hours: 'Tue–Sat 9am–6pm',
    photos: [
      'https://images.unsplash.com/photo-1487530811647-569962357165?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [],
  }),
  createPromotionBusiness({
    id: 'harbor-books',
    name: 'Harbor Books',
    category: 'Bookstore',
    distance: '4.5 mi',
    rating: 4.8,
    reviewCount: 174,
    followerCount: 710,
    latitude: 33.8439,
    longitude: -118.3414,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop',
    phone: '(310) 555-0162',
    website: 'harborbooks.com',
    address: '220 Harbor Dr, Redondo Beach, CA 90277',
    about:
      'Waterfront indie bookstore with staff picks, author readings, and a quiet nook for afternoon browsing.',
    hours: 'Wed–Sun 10am–7pm',
    photos: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [],
  }),
  createPromotionBusiness({
    id: 'marisols-tamales',
    name: "Marisol's Tamales",
    category: 'Food Stand',
    distance: '3.1 mi',
    rating: 4.9,
    reviewCount: 267,
    followerCount: 1340,
    latitude: 34.0522,
    longitude: -118.2737,
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    phone: '(323) 555-0181',
    website: 'marisolstamales.com',
    address: '1450 Alameda St, Los Angeles, CA 90012',
    about:
      'Family-run tamale stand serving handmade red pork, green chicken, and sweet corn varieties daily.',
    hours: 'Thu–Sun 10am–6pm',
    photos: [
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [],
  }),
  createPromotionBusiness({
    id: 'neighborhood-pizza-co',
    name: 'Neighborhood Pizza Co.',
    category: 'Pizza',
    distance: '8.9 mi',
    rating: 4.6,
    reviewCount: 438,
    followerCount: 1180,
    latitude: 34.0407,
    longitude: -118.4412,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    phone: '(310) 555-0118',
    website: 'neighborhoodpizza.co',
    address: '890 Montana Ave, Santa Monica, CA 90403',
    about:
      'Neighborhood pizzeria with fermented dough, wood-fired pies, and a lively counter for pickup and slices.',
    hours: 'Daily 11am–10pm',
    photos: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80&auto=format&fit=crop',
    ],
    promotions: [],
  }),
];

export function getPromotionBusinessById(id: string): Business | undefined {
  return PROMOTION_BUSINESSES.find((business) => business.id === id);
}
