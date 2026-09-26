export type BusinessSearchRow = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  state: string | null;
  street_address: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: string;
  logo_url: string | null;
  cover_image_url: string | null;
  imageUrl: string | null;
  distanceMiles: number | null;
  distanceLabel: string | null;
};

export type BusinessSearchResult = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  state: string | null;
  locationLabel: string | null;
  imageUrl: string | null;
  verified: boolean;
  distanceMiles: number | null;
  distanceLabel: string | null;
};
