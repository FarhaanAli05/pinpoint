import type { Pin } from "./types";
import type { UserIntent } from "./types";

/** Filter pins by user's intent from the questionnaire */
export function filterPinsByIntent(pins: Pin[], intent: UserIntent | null): Pin[] {
  if (!intent) return pins;

  switch (intent) {
    case "looking-for-room":
      // I'm looking for a room or flat — show places available to rent
      return pins.filter(
        (p) => p.category === "sublet" || p.category === "share-listing"
      );
    case "have-sublet":
      // I have a place to sublet — show everything (later: add your listing)
      return pins;
    case "need-roommates":
      // I found a place and need roommates — show others who share or are looking
      return pins.filter(
        (p) =>
          p.category === "share-listing" ||
          p.category === "looking-for-roommates"
      );
    case "searching-with-mates":
      // I'm searching for an apartment and need roommates — show people looking + available rooms
      return pins.filter(
        (p) =>
          p.category === "looking-for-roommates" || p.category === "sublet"
      );
    default:
      return pins;
  }
}
