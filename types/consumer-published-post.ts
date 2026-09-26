import type { ExplorePost } from '@/data/explore-posts';
import type { PostType } from '@/types/supabase-post';

/** Consumer-facing published post (Explore-compatible + profile/detail fields). */
export type ConsumerPublishedPost = ExplorePost & {
  postType: PostType;
  createdAt: string;
};
