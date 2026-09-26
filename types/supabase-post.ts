export type PostStatus = 'draft' | 'published' | 'archived';

export type PostType = 'photo' | 'announcement';

export type PostRow = {
  id: string;
  business_id: string;
  caption: string | null;
  image_url: string | null;
  post_type?: PostType | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
};

export type BusinessPost = {
  id: string;
  businessId: string;
  postType: PostType;
  caption: string | null;
  imageUrl: string | null;
  status: PostStatus;
  createdAt: string;
};
