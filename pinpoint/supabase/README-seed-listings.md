# Kijiji listings seed (postalCode + multiple images)

The `property_listings` table stores each listing as JSONB in the `data` column, so **no migration is needed** for the new shape: `postalCode` and multiple `images` are just fields inside that JSON.

## Seed file

- **`seed-kijiji-listings.sql`** – Run in Supabase SQL Editor. It currently contains 3 listings in the new format (postalCode + multiple images) and 47 in the old format.

## Full 67 listings

To regenerate the seed from your full 67-item JSON:

1. Save your JSON array (all 67 listing objects) to **`supabase/kijiji-listings-67.json`**.
2. From the **`pinpoint`** folder run:
   ```bash
   node scripts/generate-kijiji-seed.js
   ```
3. This overwrites `seed-kijiji-listings.sql` with an INSERT that loads all items from the JSON file.
4. Run the new `seed-kijiji-listings.sql` in the Supabase SQL Editor.

Each listing object in the JSON should include: `id`, `lat`, `lng`, `rent`, `moveInDate`, `type`, `title`, `description`, `address`, `postalCode`, `bedrooms`, `features`, `externalLink`, `images` (array of URLs), `sourceType`, `sourceLabel`, `createdAt`.
