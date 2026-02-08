#!/usr/bin/env node
/**
 * Generates supabase/seed-kijiji-listings.sql from supabase/kijiji-listings-67.json.
 * Run from repo root: node scripts/generate-kijiji-seed.js
 */
const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "../supabase/kijiji-listings-67.json");
const outPath = path.join(__dirname, "../supabase/seed-kijiji-listings.sql");

let data;
try {
  data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
} catch (e) {
  console.error("Failed to read or parse", jsonPath, e.message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error("JSON must be an array of listing objects.");
  process.exit(1);
}

const lines = data.map((obj) => "  " + JSON.stringify(obj)).join(",\n");
const sql = `-- Run in Supabase SQL Editor after migration 008.
-- Inserts ${data.length} Kijiji listings (postalCode + multiple images per listing). Re-seed: run this script or paste the JSON array below.

DELETE FROM public.property_listings;

INSERT INTO public.property_listings (id, data)
SELECT elem->>'id', elem
FROM jsonb_array_elements($json$
[
${lines}
]
$json$::jsonb) AS elem;
`;

fs.writeFileSync(outPath, sql, "utf8");
console.log("Wrote", outPath, "with", data.length, "listings.");
