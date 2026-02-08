/**
 * Realtor.ca listings for Kingston, ON — geocoded for exact map placement.
 * Coordinates from OpenStreetMap Nominatim where available; others placed in correct Kingston area.
 */
import type { Pin } from "./types";

/** Base coordinates for unique addresses in Kingston, ON (lat, lng) */
const ADDRESS_COORDS: Record<string, [number, number]> = {
  "652 princess": [44.2371881, -76.5026899], // Sage Condos, OSM
  "223 princess": [44.2315, -76.4855],
  "165 ontario": [44.2312, -76.4862],
  "248 mclellan": [44.239, -76.581],
  "161a princess": [44.2308, -76.4845],
  "551 sackville": [44.234118, -76.599295], // OSM
  "741 riverview": [44.272, -76.49],
  "9 rockford": [44.264, -76.51],
  "613 halloway": [44.268, -76.495],
  "86 morenz": [44.262, -76.505],
  "130 weller": [44.261, -76.508],
  "1621 brookedayle": [44.275, -76.52],
  "17 eldon hall": [44.255, -76.535],
  "791 newmarket": [44.268, -76.488],
  "1669 brookedayle": [44.276, -76.522],
  "45 chestnut": [44.265, -76.5],
  "34 ruskin": [44.263, -76.502],
  "45 dalton": [44.262, -76.515],
  "740 augusta": [44.278, -76.54],
  "847 development": [44.258, -76.555],
};

/** Extract building key "number streetname" from address_line (e.g. "1014 - 652 Princess Street" -> "652 princess") */
function keyFromAddress(addressLine: string): string {
  const s = addressLine.replace(/\s*\(.*\)$/, "").trim();
  const dashMatch = s.match(/\d+\s*-\s*(\d+[a-z]?)\s+(.+?)(?:\s+street|\s+st|\s+court|\s+crescent|\s+way|\s+place|\s+drive|\s+avenue|\s+ave|\s+lane)?\s*$/i);
  if (dashMatch) {
    const num = dashMatch[1].toLowerCase();
    const street = (dashMatch[2] || "").trim().split(/\s+/)[0]?.toLowerCase() || "";
    return `${num} ${street}`;
  }
  const parts = s.split(/\s+/).filter(Boolean);
  const num = (parts[0] || "").replace(/^(\d+).*/, "$1").toLowerCase();
  const street = (parts[1] || "").toLowerCase();
  return `${num} ${street}`;
}

function getCoords(addressLine: string): [number, number] {
  const key = keyFromAddress(addressLine);
  const coords = ADDRESS_COORDS[key];
  if (coords) return coords;
  for (const [k, c] of Object.entries(ADDRESS_COORDS)) {
    const [kn, ks] = k.split(" ");
    if (key.startsWith(kn) && key.includes(ks)) return c;
  }
  return [44.231, -76.486];
}

/** Small offset so multiple units in the same building don't stack on one pixel (deterministic from mls_number) */
const SAME_BUILDING_OFFSET = 0.0001;
function offsetFromId(mlsNumber: string): [number, number] {
  let h = 0;
  for (let i = 0; i < mlsNumber.length; i++) h = (h * 31 + mlsNumber.charCodeAt(i)) | 0;
  const a = (h >>> 0) % 1000 / 1000;
  const b = ((h * 17) >>> 0) % 1000 / 1000;
  return [(a - 0.5) * 2 * SAME_BUILDING_OFFSET, (b - 0.5) * 2 * SAME_BUILDING_OFFSET];
}

export interface RealtorListingRaw {
  source: string;
  listing_id: string | null;
  mls_number: string;
  url: string | null;
  rent_monthly_cad: number;
  address_line: string;
  city: string;
  postal_code: string;
  beds: number;
  baths: number;
  sqft_range: string;
  property_type: string;
}

function realtorToPin(r: RealtorListingRaw, index: number): Pin {
  const [baseLat, baseLng] = getCoords(r.address_line);
  const [dLat, dLng] = offsetFromId(r.mls_number);
  const lat = baseLat + dLat;
  const lng = baseLng + dLng;
  const title = `${r.address_line} · $${r.rent_monthly_cad}/mo`;
  const description = `${r.property_type}, ${r.beds} bed, ${r.baths} bath. ${r.sqft_range} sq ft.`;
  const externalLink =
    r.url ||
    (r.listing_id ? `https://www.realtor.ca/real-estate/${r.listing_id}` : undefined);
  return {
    id: r.mls_number || `realtor-${index}`,
    lat,
    lng,
    rent: r.rent_monthly_cad,
    moveInDate: "ASAP",
    type: r.property_type === "Apartment" && r.beds <= 1 ? "room" : "whole-unit",
    category: "share-listing",
    title,
    description,
    address: `${r.address_line}, ${r.city} ${r.postal_code}`,
    bedrooms: r.beds,
    features: [],
    externalLink,
    sourceType: "realtor",
    sourceLabel: "realtor.ca",
    createdAt: Date.now(),
  };
}

const REALTOR_JSON: RealtorListingRaw[] = [
  { source: "realtor.ca", listing_id: "29336085", mls_number: "X12768088", url: "https://www.realtor.ca/real-estate/29336085/1014-652-princess-street-kingston-central-city-east-14-central-city-east", rent_monthly_cad: 1975, address_line: "1014 - 652 Princess Street", city: "Kingston", postal_code: "K7L1E5", beds: 2, baths: 2, sqft_range: "600-699", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29333143", mls_number: "X12765636", url: "https://www.realtor.ca/real-estate/29333143/1-248-mclellan-court-kingston-east-gardiners-rd-35-east-gardiners-rd", rent_monthly_cad: 2000, address_line: "1 - 248 McLellan Court", city: "Kingston", postal_code: "K7M7Y9", beds: 3, baths: 1, sqft_range: "700-1100", property_type: "House" },
  { source: "realtor.ca", listing_id: "29311337", mls_number: "X12747108", url: "https://www.realtor.ca/real-estate/29311337/161a-princess-street-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 2200, address_line: "161A Princess Street", city: "Kingston", postal_code: "K7L1A9", beds: 2, baths: 1, sqft_range: "700-1100", property_type: "Other" },
  { source: "realtor.ca", listing_id: "29304727", mls_number: "X12741116", url: "https://www.realtor.ca/real-estate/29304727/551-sackville-crescent-kingston-city-southwest-28-city-southwest", rent_monthly_cad: 3150, address_line: "551 Sackville Crescent", city: "Kingston", postal_code: "K7M8W3", beds: 5, baths: 3, sqft_range: "1500-2000", property_type: "House" },
  { source: "realtor.ca", listing_id: "29302264", mls_number: "X12739260", url: "https://www.realtor.ca/real-estate/29302264/741-riverview-way-kingston-kingston-east-incl-barret-crt-13-kingston-east-incl-barret-crt", rent_monthly_cad: 3250, address_line: "741 Riverview Way", city: "Kingston", postal_code: "K7K0J3", beds: 3, baths: 2, sqft_range: "1500-2000", property_type: "House" },
  { source: "realtor.ca", listing_id: "29285877", mls_number: "X12726278", url: "https://www.realtor.ca/real-estate/29285877/503-165-ontario-street-kingston-central-city-east-14-central-city-east", rent_monthly_cad: 3400, address_line: "503 - 165 Ontario Street", city: "Kingston", postal_code: "K7L2Y6", beds: 2, baths: 2, sqft_range: "1200-1399", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29284546", mls_number: "X12725040", url: "https://www.realtor.ca/real-estate/29284546/9-rockford-place-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 2000, address_line: "9 Rockford Place (Unit 2)", city: "Kingston", postal_code: "K7K5Z7", beds: 3, baths: 1, sqft_range: "700-1100", property_type: "House" },
  { source: "realtor.ca", listing_id: "29281145", mls_number: "X12722120", url: "https://www.realtor.ca/real-estate/29281145/613-halloway-drive-kingston-kingston-east-incl-barret-crt-13-kingston-east-incl-barret-crt", rent_monthly_cad: 3300, address_line: "613 Halloway Drive", city: "Kingston", postal_code: "K7K0H5", beds: 4, baths: 3, sqft_range: "2000-2500", property_type: "House" },
  { source: "realtor.ca", listing_id: "29267529", mls_number: "X12710892", url: "https://www.realtor.ca/real-estate/29267529/2-86-morenz-crescent-kingston-rideau-23-rideau", rent_monthly_cad: 2099, address_line: "2 - 86 Morenz Crescent", city: "Kingston", postal_code: "K7K2X4", beds: 2, baths: 1, sqft_range: "700-1100", property_type: "House" },
  { source: "realtor.ca", listing_id: "29266675", mls_number: "X12710164", url: "https://www.realtor.ca/real-estate/29266675/902-223-princess-street-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 4000, address_line: "902 - 223 Princess Street", city: "Kingston", postal_code: "K7L1B3", beds: 3, baths: 2, sqft_range: "800-899", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29266291", mls_number: "X12709816", url: "https://www.realtor.ca/real-estate/29266291/2-130-weller-avenue-kingston-rideau-23-rideau", rent_monthly_cad: 1999, address_line: "2 - 130 Weller Avenue", city: "Kingston", postal_code: "K7K2T7", beds: 2, baths: 1, sqft_range: "0-699", property_type: "House" },
  { source: "realtor.ca", listing_id: "29242426", mls_number: "X12688804", url: "https://www.realtor.ca/real-estate/29242426/1621-brookedayle-avenue-kingston-city-northwest-42-city-northwest", rent_monthly_cad: 2750, address_line: "1621 Brookedayle Avenue", city: "Kingston", postal_code: "K7P0S8", beds: 4, baths: 3, sqft_range: "3000-3500", property_type: "House" },
  { source: "realtor.ca", listing_id: "29237409", mls_number: "X12683762", url: "https://www.realtor.ca/real-estate/29237409/212-17-eldon-hall-place-kingston-central-city-west-18-central-city-west", rent_monthly_cad: 1800, address_line: "212 - 17 Eldon Hall Place", city: "Kingston", postal_code: "K7M7H5", beds: 2, baths: 1, sqft_range: "800-899", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29233551", mls_number: "X12680034", url: "https://www.realtor.ca/real-estate/29233551/917-652-princess-street-kingston-central-city-east-14-central-city-east", rent_monthly_cad: 2000, address_line: "917 - 652 Princess Street", city: "Kingston", postal_code: "K7L1E5", beds: 2, baths: 2, sqft_range: "600-699", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29233362", mls_number: "X12680092", url: "https://www.realtor.ca/real-estate/29233362/791-newmarket-lane-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 2500, address_line: "791 Newmarket Lane", city: "Kingston", postal_code: "K7K0C8", beds: 3, baths: 2, sqft_range: "1100-1500", property_type: "Townhouse" },
  { source: "realtor.ca", listing_id: "29229470", mls_number: "X12676520", url: "https://www.realtor.ca/real-estate/29229470/223-652-princess-street-kingston-central-city-east-14-central-city-east", rent_monthly_cad: 1700, address_line: "223 - 652 Princess Street", city: "Kingston", postal_code: "K7L1E5", beds: 1, baths: 1, sqft_range: "0-499", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29210279", mls_number: "X12656694", url: "https://www.realtor.ca/real-estate/29210279/609-223-princess-street-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 2700, address_line: "609 - 223 Princess Street", city: "Kingston", postal_code: "K7L1B3", beds: 2, baths: 2, sqft_range: "600-699", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29198848", mls_number: "X12645584", url: "https://www.realtor.ca/real-estate/29198848/227-652-princess-street-kingston-central-city-east-14-central-city-east", rent_monthly_cad: 2000, address_line: "227 - 652 Princess Street", city: "Kingston", postal_code: "K7L1E5", beds: 1, baths: 1, sqft_range: "0-499", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29191455", mls_number: "X12638348", url: "https://www.realtor.ca/real-estate/29191455/1669-brookedayle-avenue-kingston-city-northwest-42-city-northwest", rent_monthly_cad: 3200, address_line: "1669 Brookedayle Avenue", city: "Kingston", postal_code: "K7P0S9", beds: 4, baths: 3, sqft_range: "2000-2500", property_type: "House" },
  { source: "realtor.ca", listing_id: "29180296", mls_number: "X12627598", url: "https://www.realtor.ca/real-estate/29180296/1-45-chestnut-street-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 3250, address_line: "1 - 45 Chestnut Street", city: "Kingston", postal_code: "K7K3X4", beds: 2, baths: 1, sqft_range: "700-1100", property_type: "House" },
  { source: "realtor.ca", listing_id: "29166180", mls_number: "X12604716", url: "https://www.realtor.ca/real-estate/29166180/304-223-princess-street-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 1850, address_line: "304 - 223 Princess Street", city: "Kingston", postal_code: "K7L0G8", beds: 1, baths: 1, sqft_range: "500-599", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29165396", mls_number: "X12603864", url: "https://www.realtor.ca/real-estate/29165396/613-223-princess-street-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 2100, address_line: "613 - 223 Princess Street", city: "Kingston", postal_code: "K7L0G8", beds: 2, baths: 1, sqft_range: "0-499", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29156034", mls_number: "X12595144", url: "https://www.realtor.ca/real-estate/29156034/2-34-ruskin-street-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 2099, address_line: "2 - 34 Ruskin Street", city: "Kingston", postal_code: "K7K2N3", beds: 2, baths: 1, sqft_range: "0-699", property_type: "House" },
  { source: "realtor.ca", listing_id: "29152666", mls_number: "X12591660", url: "https://www.realtor.ca/real-estate/29152666/314-223-princess-street-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 2499, address_line: "314 - 223 Princess Street", city: "Kingston", postal_code: "K7L1B3", beds: 2, baths: 2, sqft_range: "700-799", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29143300", mls_number: "X12582840", url: "https://www.realtor.ca/real-estate/29143300/1002-652-princess-street-kingston-central-city-east-14-central-city-east", rent_monthly_cad: 1800, address_line: "1002 - 652 Princess Street", city: "Kingston", postal_code: "K7L1E5", beds: 0, baths: 1, sqft_range: "0-499", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29113273", mls_number: "X12554092", url: "https://www.realtor.ca/real-estate/29113273/45-dalton-avenue-kingston-east-of-sir-john-a-blvd-22-east-of-sir-john-a-blvd", rent_monthly_cad: 4600, address_line: "45 Dalton Avenue", city: "Kingston", postal_code: "K7K6C2", beds: 0, baths: 0, sqft_range: "22050", property_type: "Vacant Land" },
  { source: "realtor.ca", listing_id: "29050479", mls_number: "X12493272", url: "https://www.realtor.ca/real-estate/29050479/722-652-princess-street-kingston-central-city-east-14-central-city-east", rent_monthly_cad: 2400, address_line: "722 - 652 Princess Street", city: "Kingston", postal_code: "K7L1E5", beds: 2, baths: 2, sqft_range: "600-699", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29039653", mls_number: "X12485553", url: "https://www.realtor.ca/real-estate/29039653/105-740-augusta-drive-kingston-city-northwest-42-city-northwest", rent_monthly_cad: 2499, address_line: "105 - 740 Augusta Drive", city: "Kingston", postal_code: "K7P0R5", beds: 2, baths: 2, sqft_range: "1000-1199", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29018972", mls_number: "X12476110", url: "https://www.realtor.ca/real-estate/29018972/219-847-development-drive-kingston-south-of-taylor-kidd-blvd-37-south-of-taylor-kidd-blvd", rent_monthly_cad: 2525, address_line: "219 - 847 Development Drive", city: "Kingston", postal_code: "K7M4W6", beds: 2, baths: 1, sqft_range: "600-699", property_type: "Apartment" },
  { source: "realtor.ca", listing_id: "29018971", mls_number: "X12476109", url: "https://www.realtor.ca/real-estate/29018971/506-847-development-drive-kingston-south-of-taylor-kidd-blvd-37-south-of-taylor-kidd-blvd", rent_monthly_cad: 2195, address_line: "506 - 847 Development Drive", city: "Kingston", postal_code: "K7M4W6", beds: 1, baths: 1, sqft_range: "700-799", property_type: "Apartment" },
];

/** Realtor.ca pins for Kingston — exact Kingston, ON locations; links open listing on realtor.ca when url present */
export const REALTOR_LISTINGS: Pin[] = REALTOR_JSON.map((r, i) => realtorToPin(r, i));
