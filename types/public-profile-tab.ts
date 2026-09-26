export type PublicProfileTab = 'posts' | 'menu' | 'promotions' | 'events' | 'reviews' | 'about';

export const PUBLIC_PROFILE_TABS: { id: PublicProfileTab; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'menu', label: 'Menu' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'events', label: 'Events' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'about', label: 'About' },
];
