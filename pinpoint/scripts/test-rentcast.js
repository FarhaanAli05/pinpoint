/**
 * Test RentCast API for Kingston. Run from repo root:
 *   node pinpoint/scripts/test-rentcast.js
 * Or from pinpoint/:
 *   node scripts/test-rentcast.js
 * Loads .env from repo root or pinpoint/ so RENTCAST_API_KEY is set.
 */
const fs = require("fs");
const path = require("path");

function loadEnv(dir) {
  const envPath = path.join(dir, ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
}

const root = path.resolve(__dirname, "../..");
const pinpoint = path.resolve(__dirname, "..");
loadEnv(root);
loadEnv(pinpoint);

const apiKey = process.env.RENTCAST_API_KEY;
if (!apiKey) {
  console.error("RENTCAST_API_KEY not found. Add it to .env in repo root or pinpoint/");
  process.exit(1);
}

const RENTCAST_URL = "https://api.rentcast.io/v1/listings/rental/long-term";

async function test(city, state, label) {
  const url = new URL(RENTCAST_URL);
  url.searchParams.set("city", city);
  url.searchParams.set("state", state);
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Api-Key": apiKey },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.log(`${label} (${city}, ${state}): ${res.status} - ${text.slice(0, 200)}`);
    return;
  }
  const items = Array.isArray(data) ? data : data?.listings ?? data?.data ?? [];
  console.log(`${label} (${city}, ${state}): ${res.status} - ${items.length} listings`);
  if (items.length > 0 && items[0]) {
    console.log("  Sample:", JSON.stringify(items[0], null, 2).split("\n").slice(0, 15).join("\n"));
  }
}

(async () => {
  console.log("Testing RentCast API (Kingston)...\n");
  await test("Kingston", "ON", "Kingston, Ontario (Canada)");
  await test("Kingston", "NY", "Kingston, NY (US)");
  console.log("\nDone.");
})();
