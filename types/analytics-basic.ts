/** Which Basic metrics have legitimate persisted data in the current product. */
export type AnalyticsMetricAvailability = 'ready' | 'unavailable';

export type BasicOverviewMetricId =
  | 'profile_views'
  | 'post_views'
  | 'saves'
  | 'new_followers'
  | 'likes'
  | 'comments';

export type BasicOverviewMetricDefinition = {
  id: BasicOverviewMetricId;
  label: string;
  icon:
    | 'eye-outline'
    | 'play-outline'
    | 'bookmark-outline'
    | 'person-add-outline'
    | 'heart-outline'
    | 'chatbubble-outline';
  iconTone: 'emerald' | 'amber' | 'gold' | 'coral' | 'blue';
  availability: AnalyticsMetricAvailability;
  unavailableHint: string;
};

export const BASIC_OVERVIEW_METRICS: BasicOverviewMetricDefinition[] = [
  {
    id: 'profile_views',
    label: 'Profile Views',
    icon: 'eye-outline',
    iconTone: 'emerald',
    availability: 'unavailable',
    unavailableHint: 'View tracking is not live yet.',
  },
  {
    id: 'post_views',
    label: 'Post Views',
    icon: 'play-outline',
    iconTone: 'coral',
    availability: 'unavailable',
    unavailableHint: 'Post view tracking is not live yet.',
  },
  {
    id: 'saves',
    label: 'Saves',
    icon: 'bookmark-outline',
    iconTone: 'amber',
    availability: 'unavailable',
    unavailableHint: 'Save analytics are not aggregated yet.',
  },
  {
    id: 'new_followers',
    label: 'New Followers',
    icon: 'person-add-outline',
    iconTone: 'gold',
    availability: 'unavailable',
    unavailableHint: 'Follower trends will appear once period reporting is enabled.',
  },
  {
    id: 'likes',
    label: 'Likes',
    icon: 'heart-outline',
    iconTone: 'coral',
    availability: 'ready',
    unavailableHint: 'Unable to load likes right now.',
  },
  {
    id: 'comments',
    label: 'Comments',
    icon: 'chatbubble-outline',
    iconTone: 'blue',
    availability: 'ready',
    unavailableHint: 'Unable to load comments right now.',
  },
];
