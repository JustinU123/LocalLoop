export type BusinessVideo = {
  id: string;
  thumbnail: string;
  caption: string;
  views: string;
  likes: string;
};

export type MenuItem = {
  name: string;
  price: string;
  description: string;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export type BusinessReview = {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
};

export type Business = {
  id: string;
  name: string;
  category: string;
  distance: string;
  rating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  image: string;
  logo: string;
  cover: string;
  verified: boolean;
  isOpen: boolean;
  phone: string;
  website: string;
  address: string;
  about: string;
  hours: string;
  trending?: boolean;
  hiddenGem?: boolean;
  photos: string[];
  videos: BusinessVideo[];
  menu: MenuSection[];
  reviews: BusinessReview[];
};

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80&auto=format&fit=crop',
];

function buildVideos(cover: string, name: string): BusinessVideo[] {
  return [
    {
      id: 'v1',
      thumbnail: cover,
      caption: `Behind the scenes at ${name} ✨`,
      views: '12.4K',
      likes: '1.8K',
    },
    {
      id: 'v2',
      thumbnail: cover.replace('w=900', 'w=800'),
      caption: 'Customer favorite this week 🔥',
      views: '8.2K',
      likes: '940',
    },
    {
      id: 'v3',
      thumbnail: cover,
      caption: 'Meet the team & our story',
      views: '5.6K',
      likes: '612',
    },
  ];
}

function buildReviews(rating: number): BusinessReview[] {
  const snippets = [
    'Absolutely loved the atmosphere. Will definitely be back!',
    'Great service and attention to detail. A hidden gem in the neighborhood.',
    'One of the best local spots I have found this year. Highly recommend.',
    'Perfect for a casual visit. Everything felt thoughtful and welcoming.',
  ];

  return snippets.map((text, index) => ({
    id: `r${index + 1}`,
    author: ['Maya Chen', 'Jordan Lee', 'Sofia Alvarez', 'Alex Kim'][index],
    avatar: AVATARS[index],
    rating: Math.max(4, Math.min(5, rating - (index % 2) * 0.2)),
    date: ['2d ago', '1w ago', '2w ago', '3w ago'][index],
    text,
  }));
}

function buildMenu(category: string): MenuSection[] {
  if (category === 'Coffee') {
    return [
      {
        title: 'Espresso Bar',
        items: [
          { name: 'Single Origin Pour Over', price: '$5.50', description: 'Rotating seasonal bean' },
          { name: 'Cortado', price: '$4.75', description: 'Double ristretto, steamed milk' },
          { name: 'Black Cat Espresso', price: '$4.25', description: 'House blend' },
        ],
      },
      {
        title: 'Pastries',
        items: [
          { name: 'Almond Croissant', price: '$4.95', description: 'Baked fresh every morning' },
          { name: 'Banana Bread', price: '$3.75', description: 'Walnut crumble top' },
        ],
      },
    ];
  }

  if (category === 'Food') {
    return [
      {
        title: 'Breakfast & Pastries',
        items: [
          { name: 'Kimchi Fried Rice', price: '$18', description: 'Soft egg, bacon, scallions' },
          { name: 'Bacon & Egg Sandwich', price: '$16', description: 'On house-made brioche' },
        ],
      },
      {
        title: 'Dinner',
        items: [
          { name: 'Grilled Octopus', price: '$32', description: 'Romesco, potatoes, herbs' },
          { name: 'Mushroom Tagliatelle', price: '$28', description: 'Parmesan, thyme butter' },
        ],
      },
    ];
  }

  if (category === 'Clothing') {
    return [
      {
        title: 'Collections',
        items: [
          { name: 'Vintage Denim Edit', price: 'From $98', description: 'Curated premium denim' },
          { name: 'Designer Resale', price: 'From $120', description: 'Rotating archive pieces' },
          { name: 'Accessories', price: 'From $45', description: 'Bags, jewelry, and more' },
        ],
      },
    ];
  }

  if (category === 'Beauty') {
    return [
      {
        title: 'Blowouts',
        items: [
          { name: 'The Cosmo', price: '$55', description: 'Loose, wavy texture' },
          { name: 'The Manhattan', price: '$55', description: 'Sleek, smooth finish' },
          { name: 'The Southern Comfort', price: '$55', description: 'Big, bouncy volume' },
        ],
      },
    ];
  }

  return [
    {
      title: 'Classes',
      items: [
        { name: 'Full Body (55 min)', price: '$36', description: 'Strength + cardio intervals' },
        { name: 'Arms & Abs (55 min)', price: '$36', description: 'Upper body focus' },
        { name: 'First Timer Package', price: '$99', description: '3 classes for new clients' },
      ],
    },
  ];
}

export function getAppleMapsDirectionsUrl(latitude: number, longitude: number): string {
  return `maps://?daddr=${latitude},${longitude}`;
}

export const BUSINESSES: Business[] = [
  {
    id: 'intelligentsia-silver-lake',
    name: 'Intelligentsia Coffee',
    category: 'Coffee',
    distance: '0.3 mi',
    rating: 4.5,
    reviewCount: 1284,
    latitude: 34.091154,
    longitude: -118.279053,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    isOpen: true,
    phone: '(323) 663-6173',
    website: 'intelligentsiacoffee.com',
    address: '3922 W Sunset Blvd, Los Angeles, CA 90026',
    about:
      'Pioneering specialty coffee roaster and café in Silver Lake, known for direct-trade beans, precise brewing, and a bright, minimalist space.',
    hours: 'Daily 7am–7pm',
    trending: true,
    hiddenGem: true,
    photos: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80&auto=format&fit=crop',
    ],
    videos: buildVideos(
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80&auto=format&fit=crop',
      'Intelligentsia Coffee',
    ),
    menu: buildMenu('Coffee'),
    reviews: buildReviews(4.5),
  },
  {
    id: 'republique-la',
    name: 'République',
    category: 'Food',
    distance: '0.6 mi',
    rating: 4.6,
    reviewCount: 4521,
    latitude: 34.062756,
    longitude: -118.343933,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    isOpen: true,
    phone: '(310) 362-6115',
    website: 'republiquela.com',
    address: '624 S La Brea Ave, Los Angeles, CA 90036',
    about:
      'Landmark French-inspired bakery and restaurant in a historic 1920s building, serving acclaimed pastries, brunch, and seasonal California cuisine.',
    hours: 'Mon–Fri 8am–10pm · Sat–Sun 8am–11pm',
    trending: true,
    photos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80&auto=format&fit=crop',
    ],
    videos: buildVideos(
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80&auto=format&fit=crop',
      'République',
    ),
    menu: buildMenu('Food'),
    reviews: buildReviews(4.6),
  },
  {
    id: 'american-rag-la',
    name: 'American Rag Cie',
    category: 'Clothing',
    distance: '0.7 mi',
    rating: 4.4,
    reviewCount: 892,
    latitude: 34.073097,
    longitude: -118.344352,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1483985988350-763728e3685b?w=300&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    isOpen: true,
    phone: '(323) 653-1907',
    website: 'americanrag.com',
    address: '150 S La Brea Ave, Los Angeles, CA 90036',
    about:
      'Iconic Los Angeles fashion destination blending vintage, designer, and streetwear across a multi-level La Brea storefront open since 1988.',
    hours: 'Mon–Sat 11am–7pm · Sun 12pm–6pm',
    trending: true,
    hiddenGem: true,
    photos: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1483985988350-763728e3685b?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&auto=format&fit=crop',
    ],
    videos: buildVideos(
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&auto=format&fit=crop',
      'American Rag Cie',
    ),
    menu: buildMenu('Clothing'),
    reviews: buildReviews(4.4),
  },
  {
    id: 'drybar-brentwood',
    name: 'Drybar Brentwood',
    category: 'Beauty',
    distance: '1.2 mi',
    rating: 4.3,
    reviewCount: 634,
    latitude: 34.047667,
    longitude: -118.465389,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    isOpen: true,
    phone: '(310) 481-1287',
    website: 'drybar.com',
    address: '11757 Wilshire Blvd, Los Angeles, CA 90025',
    about:
      'Blowout-focused salon on Wilshire in Brentwood offering quick, styled hair appointments in a lively, champagne-friendly atmosphere.',
    hours: 'Mon–Sat 7am–7pm · Sun 8am–5pm',
    hiddenGem: true,
    photos: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80&auto=format&fit=crop',
    ],
    videos: buildVideos(
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80&auto=format&fit=crop',
      'Drybar Brentwood',
    ),
    menu: buildMenu('Beauty'),
    reviews: buildReviews(4.3),
  },
  {
    id: 'barrys-weho',
    name: "Barry's Bootcamp",
    category: 'Fitness',
    distance: '0.9 mi',
    rating: 4.7,
    reviewCount: 2103,
    latitude: 34.077019,
    longitude: -118.381431,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300&q=80&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=80&auto=format&fit=crop',
    verified: true,
    isOpen: true,
    phone: '(323) 782-0338',
    website: 'barrys.com',
    address: '8730 Beverly Blvd, West Hollywood, CA 90048',
    about:
      'High-intensity interval studio on Beverly Blvd combining treadmill sprints and strength training in a signature red-room experience.',
    hours: 'Daily 5am–9pm',
    trending: true,
    photos: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&auto=format&fit=crop',
    ],
    videos: buildVideos(
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80&auto=format&fit=crop',
      "Barry's Bootcamp",
    ),
    menu: buildMenu('Fitness'),
    reviews: buildReviews(4.7),
  },
];

export function getBusinessById(id: string): Business | undefined {
  return BUSINESSES.find((business) => business.id === id);
}
