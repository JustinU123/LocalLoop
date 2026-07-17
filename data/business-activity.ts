export type BusinessActivityItem = {
  id: string;
  message: string;
  group: 'today' | 'earlier';
  unread?: boolean;
};

export const PLACEHOLDER_BUSINESS_ACTIVITY: BusinessActivityItem[] = [
  {
    id: 'today-profile-views',
    message: 'Your business profile received 12 views',
    group: 'today',
    unread: true,
  },
  {
    id: 'today-saves',
    message: '3 users saved your business',
    group: 'today',
    unread: true,
  },
  {
    id: 'today-promotion-clicks',
    message: 'Your promotion received 5 clicks',
    group: 'today',
    unread: false,
  },
  {
    id: 'earlier-follow',
    message: 'A user followed your business',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'earlier-review',
    message: 'Someone reviewed your business',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'earlier-post-save',
    message: 'Your post was saved',
    group: 'earlier',
    unread: false,
  },
];

export const BUSINESS_ACTIVITY_GROUP_LABELS = {
  today: 'Today',
  earlier: 'Earlier',
} as const;
