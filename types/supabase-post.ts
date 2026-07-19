export type PostStatus = 'draft' | 'published' | 'archived';

export type PostRow = {
  id: string;
  business_id: string;
  caption: string | null;
  image_url: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
};

export type BusinessPost = {
  id: string;
  businessId: string;
  caption: string | null;
  imageUrl: string;
  status: PostStatus;
  createdAt: string;
};
