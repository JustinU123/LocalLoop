export type NotificationType =
  | 'new_post'
  | 'new_promotion'
  | 'review_reply'
  | 'nearby_business'
  | 'event'
  | 'follow_activity';

export type NotificationGroup = 'today' | 'earlier-this-week' | 'older';

export type AppNotification = {
  id: string;
  type: NotificationType;
  businessId?: string;
  businessName: string;
  businessLogo: string;
  title: string;
  message: string;
  timeLabel: string;
  group: NotificationGroup;
  thumbnail?: string;
  read: boolean;
};

export const PLACEHOLDER_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'new_post',
    businessId: 'casa-luna-tacos',
    businessName: 'Casa Luna Tacos',
    businessLogo:
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80&auto=format&fit=crop',
    title: 'Casa Luna Tacos posted a new video',
    message: 'Fresh birria and handmade tortillas are ready.',
    timeLabel: '8 minutes ago',
    group: 'today',
    thumbnail:
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&q=80&auto=format&fit=crop',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'new_promotion',
    businessId: 'beanie-coffee-co',
    businessName: 'Beanie Coffee Co.',
    businessLogo:
      'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=200&q=80&auto=format&fit=crop',
    title: 'Beanie Coffee Co. started a new promotion',
    message: 'Free pastry with any large drink.',
    timeLabel: '34 minutes ago',
    group: 'today',
    thumbnail:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80&auto=format&fit=crop',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'new_post',
    businessId: 'eastside-vintage',
    businessName: 'Eastside Vintage',
    businessLogo:
      'https://images.unsplash.com/photo-1441986300917-64676bd846d1?w=200&q=80&auto=format&fit=crop',
    title: 'Eastside Vintage posted new arrivals',
    message: 'New one-of-one jackets just landed.',
    timeLabel: '2 hours ago',
    group: 'today',
    thumbnail:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&q=80&auto=format&fit=crop',
    read: false,
  },
  {
    id: 'notif-4',
    type: 'review_reply',
    businessId: 'bloom-stem-florals',
    businessName: 'Bloom & Stem Florals',
    businessLogo:
      'https://images.unsplash.com/photo-1487530811647-569962357165?w=200&q=80&auto=format&fit=crop',
    title: 'Bloom & Stem Florals replied to your review',
    message: 'Thank you for supporting our small business!',
    timeLabel: 'Yesterday',
    group: 'earlier-this-week',
    read: true,
  },
  {
    id: 'notif-5',
    type: 'nearby_business',
    businessId: 'marisols-tamales',
    businessName: "Marisol's Tamales",
    businessLogo:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&q=80&auto=format&fit=crop',
    title: "Marisol's Tamales posted nearby",
    message: 'Red pork, green chicken, and sweet corn available today.',
    timeLabel: '3 days ago',
    group: 'earlier-this-week',
    thumbnail:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&q=80&auto=format&fit=crop',
    read: true,
  },
  {
    id: 'notif-6',
    type: 'event',
    businessId: 'harbor-books',
    businessName: 'Harbor Books',
    businessLogo:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=80&auto=format&fit=crop',
    title: 'Harbor Books added a weekend event',
    message: 'Local author signing this Saturday.',
    timeLabel: '1 week ago',
    group: 'older',
    read: true,
  },
];

export const NOTIFICATION_GROUP_LABELS: Record<NotificationGroup, string> = {
  today: 'Today',
  'earlier-this-week': 'Earlier This Week',
  older: 'Older',
};

export const NOTIFICATION_GROUP_ORDER: NotificationGroup[] = [
  'today',
  'earlier-this-week',
  'older',
];
