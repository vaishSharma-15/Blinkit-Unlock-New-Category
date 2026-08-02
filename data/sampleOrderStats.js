/**
 * ⚠️ SAMPLE DATA — illustrative stand-in for Blinkit's real order history.
 *
 * In production these numbers come from the order database, which has them
 * automatically for every product sold — that's the whole point of using order
 * signals instead of written reviews, which are sparse. We have no backend
 * access, so the figures below are invented.
 *
 * What is NOT invented: the AI sentence generated from them. Every summary and
 * answer is a live API call made at the moment it's requested. The card shows
 * these raw numbers next to the generated sentence so the two can be compared.
 *
 * Shape per product:
 *   orders        — total orders in the trailing window
 *   reorders      — orders from customers who had bought it before
 *   returns       — returned orders
 *   returnReasons — breakdown of why, summing to `returns`
 *
 * The set below deliberately spans four outcomes so the demo can show the
 * feature behaving differently rather than always saying something nice:
 *
 *   pet-001  strong numbers, critical review text  → honest tension
 *   skn-002  strong numbers, positive review text  → clean positive
 *   skn-001  weak numbers (low reorder, high return) → honest negative
 *   pet-004  too little volume                     → card does not render
 */
export const sampleOrderStats = {
  // — Pet care ——————————————————————————————————————————————
  "pet-001": {
    orders: 389,
    reorders: 142,
    returns: 6,
    returnReasons: { "damaged packaging": 4, "wrong item sent": 2 },
  },
  "pet-002": {
    orders: 212,
    reorders: 61,
    returns: 9,
    returnReasons: { "damaged packaging": 5, "product quality": 4 },
  },
  "pet-003": {
    orders: 156,
    reorders: 58,
    returns: 4,
    returnReasons: { "wrong variant": 3, "damaged packaging": 1 },
  },
  "pet-004": {
    orders: 31, // below threshold — card must not render
    reorders: 7,
    returns: 1,
    returnReasons: { "damaged packaging": 1 },
  },

  // — Skincare ——————————————————————————————————————————————
  "skn-001": {
    orders: 274,
    reorders: 38, // weak reorder
    returns: 31, // high returns
    returnReasons: {
      "skin irritation": 14,
      "leaked in transit": 11,
      "not as described": 6,
    },
  },
  "skn-002": {
    orders: 512,
    reorders: 208,
    returns: 7,
    returnReasons: { "damaged packaging": 5, "wrong item sent": 2 },
  },
  "skn-003": {
    orders: 198,
    reorders: 54,
    returns: 11,
    returnReasons: { "texture not as expected": 6, "damaged packaging": 5 },
  },
  "skn-004": {
    orders: 341,
    reorders: 121,
    returns: 5,
    returnReasons: { "damaged packaging": 3, "wrong item sent": 2 },
  },

  // — Stationery ————————————————————————————————————————————
  // The demo's positive case: strong numbers in the one category whose real
  // review text is genuinely positive (18 praise, 0 criticism).
  "stn-001": {
    orders: 240,
    reorders: 98,
    returns: 3,
    returnReasons: { "damaged in transit": 3 },
  },
  "stn-002": {
    orders: 44, // below threshold
    reorders: 11,
    returns: 0,
    returnReasons: {},
  },
  "stn-003": {
    orders: 67,
    reorders: 15,
    returns: 3,
    returnReasons: { "damaged in transit": 2, "wrong item sent": 1 },
  },
  "stn-004": {
    orders: 39, // below threshold
    reorders: 9,
    returns: 1,
    returnReasons: { "damaged in transit": 1 },
  },

  // — Household —————————————————————————————————————————————
  "hou-001": {
    orders: 604,
    reorders: 271,
    returns: 12,
    returnReasons: { "leaked in transit": 9, "damaged packaging": 3 },
  },
  "hou-002": {
    orders: 452,
    reorders: 190,
    returns: 8,
    returnReasons: { "leaked in transit": 6, "wrong item sent": 2 },
  },
  "hou-003": {
    orders: 288,
    reorders: 96,
    returns: 5,
    returnReasons: { "leaked in transit": 4, "damaged packaging": 1 },
  },
  "hou-004": {
    orders: 173,
    reorders: 63,
    returns: 3,
    returnReasons: { "damaged packaging": 3 },
  },

  // — Kitchenware / Pharmacy / Garden ——————————————————————————
  // Added for categories that previously didn't exist in the catalogue at
  // all — a customer typing "knife", "bandage", or "plants" used to find
  // nothing to nudge toward, because there was genuinely no real product
  // behind those words. Same illustrative-sample-stats pattern as everything
  // above, not a special case.
  "kit-001": {
    orders: 187,
    reorders: 61, // healthy reorder
    returns: 5,
    returnReasons: { "blade came loose": 3, "damaged packaging": 2 },
  },
  "pha-001": {
    orders: 233,
    reorders: 44, // weak reorder — a one-time-purchase kind of product
    returns: 9,
    returnReasons: { "seal broken": 5, "expired stock": 4 },
  },
  "gdn-001": {
    orders: 96,
    reorders: 21,
    returns: 14, // high returns — live plants are fragile in transit
    returnReasons: { "plant arrived wilted": 9, "wrong plant sent": 5 },
  },

  // — Electronics ———————————————————————————————————————————
  // The category named directly in this project's own research (docs/
  // ProblemStatement.md: "a user who skipped buying earbuds on Blinkit,
  // trusts Flipkart more in terms of quality") — the exact trust gap this
  // whole feature exists to close.
  "ele-001": {
    orders: 421,
    reorders: 134, // healthy reorder for an accessory, not a consumable
    returns: 9,
    returnReasons: { "one earbud not pairing": 5, "damaged packaging": 4 },
  },
  "ele-002": {
    orders: 208,
    reorders: 52,
    returns: 13,
    returnReasons: { "charges slower than advertised": 8, "damaged packaging": 5 },
  },
  "ele-003": {
    orders: 42, // below threshold — card must not render
    reorders: 9,
    returns: 2,
    returnReasons: { "damaged packaging": 2 },
  },
};

/** Minimum orders before the numbers mean anything. Below this, no card. */
export const MIN_ORDER_VOLUME = 50;

export function getOrderStats(productId) {
  return sampleOrderStats[productId] ?? null;
}
