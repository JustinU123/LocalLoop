export type HomeBusiness = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  city: string | null;
  state: string | null;
  coverImageUrl: string | null;
  latestPostAt: string | null;
  createdAt: string;
};

export type HomeCategoryChip = {
  id: string;
  label: string;
  icon: string;
};
