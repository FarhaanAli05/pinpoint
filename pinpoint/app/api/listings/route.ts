import { NextResponse } from "next/server";
import { REALTOR_LISTINGS } from "@/lib/realtor-listings";

/**
 * Return realtor.ca listings for Kingston, ON (geocoded; links to listing when url present).
 */
export async function GET() {
  return NextResponse.json(REALTOR_LISTINGS);
}
