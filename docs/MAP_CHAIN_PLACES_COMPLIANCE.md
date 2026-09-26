# Map national-chain POI — provider compliance (Phase 0)

**Status:** Research summary for LocalLoop (Expo + `react-native-maps`). Not legal advice. Confirm with counsel and current provider agreements before paid API integration.

**Last reviewed:** March 2026 (Google Maps Platform Service Specific Terms, Places policies, Foursquare Usage Guidelines).

---

## LocalLoop map stack

| Layer | Technology |
|--------|------------|
| Map rendering | `react-native-maps` |
| iOS | Apple MapKit (non-Google basemap) |
| Android | Typically Google Maps provider |
| Local businesses | Supabase `public.businesses` (verified) — unchanged |
| Chain POIs (planned) | External Places/POI provider — **not** stored in `public.businesses` |

---

## Google Places API (New)

### Relevant terms

- [Maps Service Specific Terms — Places API](https://cloud.google.com/maps-platform/terms/maps-service-terms) §14:
  - **§14.1** — Places Content may be used in customer applications **without** a corresponding Google Map.
  - **§14.2** — Customer **must not** use Places Content **in conjunction with a non-Google map**.
- [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies):
  - Results **on a map** are described as needing a **Google Map** with attribution (policy text); off-map display has separate attribution rules.
  - **`place_id`** may be stored indefinitely; broader Places content must not be prefetched/cached except as allowed (e.g. lat/lng up to **30 consecutive days** per §14.3).
  - Visually distinguish Google content from other content; show **Google Maps** attribution where required; include third-party attributions when returned.

### iOS (Apple MapKit) — core ambiguity

Putting **Google-sourced POI pins (name, address, hours, etc.) on the same interactive map view as Apple MapKit** is very likely **“Places Content with a non-Google map”** under §14.2, regardless of whether preview UI is a separate sheet.

**Interpretations teams sometimes consider (all require Google/legal confirmation):**

1. **Not compliant for pin-rich map UX** — POI markers driven by Nearby Search on Apple MapKit basemap.
2. **§14.1 list-only / off-map UX** — Show chain results in a list or detail sheet **visually separated** from the map; map shows **only** lat/lng pins you are allowed to plot (Google permits long-lived `place_id`; lat/lng cache 30 days). Weak UX for “pins on map.”
3. **Google Map on iOS when chains enabled** — Swap to `PROVIDER_GOOGLE` (or dedicated screen) when “Include National Chains” is on. Heavy product/engineering cost; Android already Google.
4. **Places UI Kit** — Google documents UI Kit as usable **with or without any map, including non-Google maps** (§15; EEA comms). Web-oriented; evaluate mobile/WebView fit and license.
5. **EEA billing accounts** — Stricter **“No Use With any Map”** for most Places fields (except lat/lng + `place_id`); Places UI Kit called out as exception. Confirm billing region.

### Android

Basemap is often Google Maps, but **§14.2 still ties Places Content to not using it with a non-Google map** in the same application context. Do not assume Android is automatically compliant without review.

### Caching & attribution (if Google is approved)

| Data | Guidance |
|------|----------|
| `place_id` / resource name | May store indefinitely |
| Name, address, hours, phone, etc. | No long-term DB cache; refresh for display; session memory only |
| Lat/lng | Up to 30 consecutive days if cached |
| Attribution | Google Maps branding + returned `attributions`; privacy/ToS links per policies |
| Billing | Field-mask tiered SKUs (Nearby Search Pro ~$32/1k; Enterprise if hours/phone in search) |

### Phase 0 conclusion — Google

**High compliance risk** for the intended product (blue **pins on the existing `react-native-maps` canvas on iOS**) unless you adopt a Google-approved pattern (e.g. Google basemap when chains on, Places UI Kit, or off-map/list-only chain discovery).

**Do not ship Google Nearby Search pins on Apple MapKit without written alignment with Google policies or counsel.**

---

## Foursquare Places API (alternative)

### Map compatibility

Foursquare’s own developer content demonstrates Places API with **third-party maps (e.g. Mapbox)** on a single map experience — **no equivalent “non-Google map” prohibition** in the same way as Google §14.2.

**Better fit for LocalLoop’s current `react-native-maps` + MapKit-on-iOS architecture**, subject to Foursquare contract tier.

### Terms highlights

- [Usage Guidelines](https://docs.foursquare.com/fsq-developers-users/reference/usage-guidelines):
  - **`fsq_place_id`**: unlimited cache (performance).
  - **Other attributes (PAYG/Sandbox)**: **no caching** — fetch on demand.
  - **Enterprise**: 24-hour **local-device** cache only; no server cache for other attributes.
- [Visual crediting](https://foursquare.com/legal/terms/apilicenseagreement/): **“Powered by Foursquare”** on screens showing Places Data.
- Display Places Data as part of your service; no bulk re-export; rate limits per account type.

### Phase 0 conclusion — Foursquare

**Lower friction for POI pins on Apple MapKit**, with clear attribution and stricter **no server-side cache** on PAYG for place details (Edge Function should proxy and return slim DTOs; client session cache only).

**Chain classification:** Foursquare categories + your national-brand allowlist (same product approach as with Google).

---

## Comparison summary

| Criterion | Google Places (New) | Foursquare Places |
|-----------|---------------------|-------------------|
| Pins on Apple MapKit basemap | **Likely prohibited** (§14.2) | **Generally allowed** (with attribution) |
| Server-side API key | Required (Edge Function) | Required (Edge Function) |
| Stable place ID | `places/PLACE_ID` | `fsq_place_id` |
| PAYG caching of names/addresses | Restricted | **Not permitted** (IDs only) |
| Attribution | Google Maps + providers | Powered by Foursquare |
| Cost model | Field-mask SKUs | Tier / PAYG per docs |

---

## Recommendation (pending your approval)

1. **Default provider candidate:** **Foursquare Places** for v1 chain layer on current map stack, unless product accepts **Google Maps basemap on iOS when chains are enabled** or list-only Google discovery.
2. **If staying on Google:** Run formal Google Maps Platform compliance review; consider Places UI Kit or platform-specific map provider strategy.
3. **Engineering (either provider):** Supabase Edge Function proxy, no client secrets, no chain rows in `public.businesses`, session-scoped display data, documented attribution in chain preview (Phase 4+).

---

## LocalLoop product rules (unchanged)

- Chains are **additive** when “Include National Chains” is checked.
- Chains **never** use Follow, reviews, posts, promotions, or `/business/[id]` Supabase profiles.
- Future delivery (Uber Eats / DoorDash) is **out of scope** until partnerships; types may reserve extension points only.
