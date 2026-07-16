export type FollowingPost = {
  id: string;
  businessId: string;
  postImage: string;
  caption: string;
  postedAt: string;
};

export const FOLLOWING_POSTS: FollowingPost[] = [
  {
    id: 'post-1',
    businessId: 'american-rag-la',
    postImage:
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=900&q=80&auto=format&fit=crop',
    caption: '20% off all beanies today',
    postedAt: '2h ago',
  },
  {
    id: 'post-2',
    businessId: 'republique-la',
    postImage:
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=900&q=80&auto=format&fit=crop',
    caption: 'Fresh birria tacos available until sold out',
    postedAt: '5h ago',
  },
  {
    id: 'post-3',
    businessId: 'intelligentsia-silver-lake',
    postImage:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=80&auto=format&fit=crop',
    caption: 'Free pastry with any coffee before 11 AM',
    postedAt: 'Yesterday',
  },
];
