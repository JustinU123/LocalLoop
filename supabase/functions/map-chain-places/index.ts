import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  isAllowedFoodOrDrinkCategory,
  pickAllowedFoodOrDrinkCategory,
} from "./food-drink-category-filter.ts";
import {
  buildFsqFoodSearchCategoryIdsParam,
  FSQ_FOOD_SEARCH_CATEGORY_IDS,
} from "./foursquare-food-search-category-ids.ts";

const FOURSQUARE_PLACES_SEARCH_URL = "https://places-api.foursquare.com/places/search";
const FOURSQUARE_API_VERSION = "2025-06-17";

const MIN_RADIUS_MILES = 0.25;
const MAX_RADIUS_MILES = 50;
const MAX_RESULT_LIMIT = 50;
const MILES_TO_METERS = 1609.344;

const SEARCH_FIELDS = [
  "fsq_place_id",
  "name",
  "latitude",
  "longitude",
  "location",
  "categories",
  "chains",
  "distance",
].join(",");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MapBusinessCategory =
  | "all"
  | "food"
  | "coffee"
  | "clothing"
  | "bakery"
  | "markets"
  | "beauty"
  | "books"
  | "florists"
  | "fitness"
  | "other";

type FoursquareChain = { fsq_chain_id?: string; name?: string };
type FoursquareCategory = { id?: string; fsq_category_id?: string; name?: string };
type FoursquareLocation = {
  address?: string;
  locality?: string;
  region?: string;
  postcode?: string;
  country?: string;
  formatted_address?: string;
};

type FoursquarePlace = {
  fsq_place_id?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  location?: FoursquareLocation;
  categories?: FoursquareCategory[];
  chains?: FoursquareChain[];
  distance?: number;
};

type MapChainPinPayload = {
  kind: "chain";
  id: string;
  placeId: string;
  provider: "foursquare";
  name: string;
  category: string;
  fsqCategoryId?: string;
  mapCategory: MapBusinessCategory;
  keywords: string[];
  latitude: number;
  longitude: number;
  isChain: true;
  isLocalLoopMember: false;
  hasPromotion: false;
  isOpen: false;
  formattedAddress?: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function inferMapCategory(categoryLabel: string | null | undefined): MapBusinessCategory {
  const lower = (categoryLabel ?? "").trim().toLowerCase();

  if (lower.includes("coffee") || lower.includes("cafe") || lower.includes("espresso")) {
    return "coffee";
  }
  if (lower.includes("bakery") || lower.includes("pastry") || lower.includes("bread")) {
    return "bakery";
  }
  if (
    lower.includes("food") ||
    lower.includes("restaurant") ||
    lower.includes("taco") ||
    lower.includes("pizza") ||
    lower.includes("kitchen") ||
    lower.includes("ice cream") ||
    lower.includes("dessert") ||
    lower.includes("donut") ||
    lower.includes("waffle")
  ) {
    return "food";
  }
  if (
    lower.includes("cloth") ||
    lower.includes("boutique") ||
    lower.includes("vintage") ||
    lower.includes("apparel")
  ) {
    return "clothing";
  }
  if (lower.includes("market") || lower.includes("grocery") || lower.includes("produce")) {
    return "markets";
  }
  if (
    lower.includes("beauty") ||
    lower.includes("salon") ||
    lower.includes("barber") ||
    lower.includes("spa")
  ) {
    return "beauty";
  }
  if (lower.includes("book")) {
    return "books";
  }
  if (lower.includes("florist") || lower.includes("flower")) {
    return "florists";
  }
  if (
    lower.includes("fitness") ||
    lower.includes("gym") ||
    lower.includes("yoga") ||
    lower.includes("pilates")
  ) {
    return "fitness";
  }

  return "other";
}

function buildKeywords(parts: Array<string | null | undefined>): string[] {
  return parts
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function normalizePlace(place: FoursquarePlace): MapChainPinPayload | null {
  const placeId = place.fsq_place_id?.trim();
  const name = place.name?.trim();
  const latitude = place.latitude;
  const longitude = place.longitude;

  if (!placeId || !name || latitude == null || longitude == null) {
    return null;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const chains = place.chains ?? [];
  if (chains.length === 0) {
    return null;
  }

  if (!isAllowedFoodOrDrinkCategory(place.categories)) {
    return null;
  }

  const matchedCategory = pickAllowedFoodOrDrinkCategory(place.categories);
  const primaryCategory =
    matchedCategory?.name?.trim() || place.categories?.[0]?.name?.trim() || "Chain location";
  const fsqCategoryId =
    matchedCategory?.fsq_category_id?.trim() ||
    matchedCategory?.id?.trim() ||
    place.categories?.[0]?.fsq_category_id?.trim() ||
    place.categories?.[0]?.id?.trim();
  const location = place.location ?? {};
  const streetAddress = location.address?.trim() || null;
  const city = location.locality?.trim() || null;
  const state = location.region?.trim() || null;
  const postalCode = location.postcode?.trim() || null;
  const formattedAddress =
    location.formatted_address?.trim() ||
    [streetAddress, city, state, postalCode].filter(Boolean).join(", ") ||
    undefined;

  const chainNames = chains.map((chain) => chain.name?.trim()).filter(Boolean) as string[];

  return {
    kind: "chain",
    id: `chain:${placeId}`,
    placeId,
    provider: "foursquare",
    name,
    category: primaryCategory,
    ...(fsqCategoryId ? { fsqCategoryId } : {}),
    mapCategory: inferMapCategory(primaryCategory),
    keywords: buildKeywords([name, primaryCategory, ...chainNames, formattedAddress]),
    latitude,
    longitude,
    isChain: true,
    isLocalLoopMember: false,
    hasPromotion: false,
    isOpen: false,
    formattedAddress,
    streetAddress,
    city,
    state,
    postalCode,
  };
}

function parseRequestBody(raw: unknown): { latitude: number; longitude: number; radiusMiles: number } | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const body = raw as Record<string, unknown>;
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const radiusMiles = Number(body.radiusMiles);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMiles)) {
    return null;
  }

  return { latitude, longitude, radiusMiles };
}

function clampRadiusMiles(radiusMiles: number): number {
  return Math.min(MAX_RADIUS_MILES, Math.max(MIN_RADIUS_MILES, radiusMiles));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed", code: "method_not_allowed" },
      405,
    );
  }

  const apiKey = Deno.env.get("foursquare_api_key")?.trim();
  if (!apiKey) {
    return jsonResponse(
      { error: "Chain places service is not configured", code: "misconfigured" },
      500,
    );
  }

  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body", code: "invalid_input" }, 400);
  }

  const parsed = parseRequestBody(bodyRaw);
  if (!parsed) {
    return jsonResponse(
      { error: "latitude, longitude, and radiusMiles are required numbers", code: "invalid_input" },
      400,
    );
  }

  const { latitude, longitude } = parsed;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return jsonResponse({ error: "Coordinates out of range", code: "invalid_input" }, 400);
  }

  const radiusMiles = clampRadiusMiles(parsed.radiusMiles);
  const radiusMeters = Math.min(100_000, Math.round(radiusMiles * MILES_TO_METERS));

  const fsqCategoryIds = buildFsqFoodSearchCategoryIdsParam();

  const searchParams = new URLSearchParams({
    ll: `${latitude},${longitude}`,
    radius: String(radiusMeters),
    fsq_category_ids: fsqCategoryIds,
    fields: SEARCH_FIELDS,
    limit: String(MAX_RESULT_LIMIT),
    sort: "DISTANCE",
  });

  let foursquareResponse: Response;
  try {
    foursquareResponse = await fetch(`${FOURSQUARE_PLACES_SEARCH_URL}?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Places-Api-Version": FOURSQUARE_API_VERSION,
      },
    });
  } catch {
    return jsonResponse(
      { error: "Unable to reach Places provider", code: "provider_error" },
      502,
    );
  }

  if (!foursquareResponse.ok) {
    console.error("[map-chain-places] provider status", foursquareResponse.status);
    return jsonResponse(
      { error: "Places provider request failed", code: "provider_error" },
      502,
    );
  }

  let payload: { results?: FoursquarePlace[] };
  try {
    payload = await foursquareResponse.json();
  } catch {
    return jsonResponse(
      { error: "Invalid Places provider response", code: "provider_error" },
      502,
    );
  }

  const providerResults = payload.results ?? [];
  let afterChainFilterCount = 0;

  const seenPlaceIds = new Set<string>();
  const pins: MapChainPinPayload[] = [];

  for (const place of providerResults) {
    if ((place.chains?.length ?? 0) > 0) {
      afterChainFilterCount += 1;
    }
    const normalized = normalizePlace(place);
    if (!normalized || seenPlaceIds.has(normalized.placeId)) {
      continue;
    }
    seenPlaceIds.add(normalized.placeId);
    pins.push(normalized);
  }

  const foursquareSearchParams: Record<string, string> = {
    ll: `${latitude},${longitude}`,
    radius: String(radiusMeters),
    fsq_category_ids: `[${FSQ_FOOD_SEARCH_CATEGORY_IDS.length} Food taxonomy ids]`,
    fields: SEARCH_FIELDS,
    limit: String(MAX_RESULT_LIMIT),
    sort: "DISTANCE",
  };

  return jsonResponse({
    pins,
    meta: {
      provider: "foursquare",
      count: pins.length,
      radiusMeters,
      limit: MAX_RESULT_LIMIT,
      foursquareSearchParams,
      providerResultCount: providerResults.length,
      afterChainFilterCount,
    },
  });
});
