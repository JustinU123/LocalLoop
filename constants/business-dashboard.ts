export const BUSINESS_DASHBOARD_METRICS = [
  { id: 'profile-views', label: 'Profile Views', value: '0' },
  { id: 'post-views', label: 'Post Views', value: '0' },
  { id: 'promotion-clicks', label: 'Promotion Clicks', value: '0' },
  { id: 'saves', label: 'Saves', value: '0' },
  { id: 'direction-requests', label: 'Direction Requests', value: '0' },
  { id: 'new-followers', label: 'New Followers', value: '0' },
] as const;

export const BUSINESS_QUICK_ACTIONS = [
  {
    id: 'create-post',
    label: 'Create Post',
    icon: 'image-outline' as const,
    optionType: 'photo-post',
  },
  {
    id: 'create-promotion',
    label: 'Create Promotion',
    icon: 'pricetag-outline' as const,
    optionType: 'promotion',
  },
  {
    id: 'edit-profile',
    label: 'Edit Business Profile',
    icon: 'create-outline' as const,
    optionType: 'announcement',
  },
  {
    id: 'view-public-profile',
    label: 'View Public Profile',
    icon: 'eye-outline' as const,
    optionType: 'announcement',
  },
] as const;

export const BUSINESS_CREATE_OPTIONS = [
  {
    id: 'photo-post',
    title: 'Photo Post',
    description: 'Share a photo from your business with nearby customers.',
    icon: 'image-outline' as const,
  },
  {
    id: 'video-post',
    title: 'Video Post',
    description: 'Publish a short video to showcase your space, team, or product.',
    icon: 'videocam-outline' as const,
  },
  {
    id: 'promotion',
    title: 'Promotion',
    description: 'Create a limited-time offer for LocalLoop users nearby.',
    icon: 'pricetag-outline' as const,
  },
  {
    id: 'event',
    title: 'Event',
    description: 'Promote an in-store event, pop-up, or community gathering.',
    icon: 'calendar-outline' as const,
  },
  {
    id: 'product-menu',
    title: 'New Product or Menu Item',
    description: 'Highlight a new dish, product drop, or seasonal menu addition.',
    icon: 'restaurant-outline' as const,
  },
  {
    id: 'announcement',
    title: 'Announcement',
    description: 'Share hours changes, milestones, or business updates.',
    icon: 'megaphone-outline' as const,
  },
] as const;

export type BusinessCreateOptionId = (typeof BUSINESS_CREATE_OPTIONS)[number]['id'];

export const CREATE_OPTION_MESSAGES: Record<BusinessCreateOptionId, string> = {
  'photo-post': 'Photo post creation will be connected next.',
  'video-post': 'Video post creation will be connected next.',
  promotion: 'Promotion creation will be connected next.',
  event: 'Event creation will be connected next.',
  'product-menu': 'Product and menu item creation will be connected next.',
  announcement: 'Announcement creation will be connected next.',
};

export const PLACEHOLDER_BUSINESS_PROFILE = {
  name: 'Your Business',
  category: 'Independent Business',
  biography:
    'Tell customers what makes your business special. This placeholder profile will be replaced once business profile editing is connected.',
  rating: 4.8,
  reviewCount: 24,
  followers: 128,
  following: 46,
  postCount: 18,
  completeness: 60,
};
