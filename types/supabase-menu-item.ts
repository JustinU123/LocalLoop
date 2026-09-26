export type MenuItemStatus = 'draft' | 'published' | 'archived';

export type MenuItemAvailabilityStatus =
  | 'available-now'
  | 'coming-soon'
  | 'limited-availability'
  | 'sold-out';

export type MenuItemVariationRow = {
  name: string;
  values: string[];
};

export type MenuItemRow = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  price_cents: number | null;
  price_varies: boolean;
  availability_status: MenuItemAvailabilityStatus;
  available_date: string | null;
  is_limited_time: boolean;
  limited_time_start_date: string | null;
  limited_time_end_date: string | null;
  dietary_tags: string[];
  variations: MenuItemVariationRow[];
  additional_information: string | null;
  status: MenuItemStatus;
  created_at: string;
  updated_at: string;
};

export type BusinessMenuItem = {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  priceCents: number | null;
  priceVaries: boolean;
  availabilityStatus: MenuItemAvailabilityStatus;
  availableDate: string | null;
  isLimitedTime: boolean;
  limitedTimeStartDate: string | null;
  limitedTimeEndDate: string | null;
  dietaryTags: string[];
  variations: MenuItemVariationRow[];
  additionalInformation: string | null;
  status: MenuItemStatus;
  createdAt: string;
};
