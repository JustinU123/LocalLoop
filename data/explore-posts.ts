export type ExplorePostMediaType = 'photo' | 'video';

export type ExplorePost = {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo: string | null;
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

export type ExploreSegment = 'nearby' | 'following';
