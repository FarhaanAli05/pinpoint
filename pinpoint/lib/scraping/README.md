# Scraping pipeline for map pins

Listings from scraped sites often have **addresses but no lat/lng**. To place them on the map smoothly:

1. **Scrape** a listing source (e.g. Kijiji, Craigslist, local sites) — extract: address, rent, title, link, etc.
2. **Geocode** each address → `lib/scraping/geocode.ts` uses OpenStreetMap Nominatim (free). Rate limit ~1 req/s; add a short delay between calls.
3. **Convert** to our `Pin` type (see `lib/types.ts`) with `lat`, `lng`, `category: "sublet"`, etc.
4. **Merge** with app data: either inject into seed/API response or expose via an API route that returns scraped pins.

Example flow (run as a script or cron):

```ts
import { geocodeAddress } from "@/lib/scraping/geocode";
import type { Pin } from "@/lib/types";

// After scraping a listing:
const geo = await geocodeAddress("123 Main St", "Kingston", "ON");
if (geo) {
  const pin: Pin = {
    id: `scraped-${listingId}`,
    lat: geo.lat,
    lng: geo.lng,
    rent: listingRent,
    address: fullAddress,
    // ... rest of Pin
    sourceType: "seeded", // or add "scraped" to types
  };
  // push to DB or return from API
}
```

RentCast API can stay for quick data; use this pipeline when you need **precise map placement** from addresses (scraped or otherwise).
