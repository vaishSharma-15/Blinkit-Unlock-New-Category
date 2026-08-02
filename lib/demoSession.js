/**
 * Demo session state — what the viewer has *done* during this demo, as opposed
 * to the sample history they started with.
 *
 * Three things get recorded, all customer-initiated, all scoped to the sample
 * customer that was active at the time:
 *
 *   purchased — a category bought through the Unlock card. Feeding this back
 *               into eligibility is the whole point of Phase 7: buying pet care
 *               retires that nudge and leaves skincare next in line, which is
 *               what "repeated monthly exploration" actually looks like.
 *   frequent  — categories the customer chose to pin. Never automatic.
 *   searched  — a category the customer typed into the search bar, live, this
 *               session, that they haven't already bought from. Folded into
 *               `engaged` as a same-day entry, exactly as strong a signal as a
 *               sample-data search from three days ago — the eligibility
 *               engine needs no special case to see it.
 *
 * Stored in cookies so the server components that compute eligibility can read
 * them. Pure string helpers live here (client and server both import them);
 * the cookie read itself is in lib/demoCustomer.js, which is server-only.
 */

export const PURCHASED_COOKIE = "demoPurchased";
export const FREQUENT_COOKIE = "demoFrequent";
export const SEARCHED_COOKIE = "demoSearched";

/** Entries are stored as `customerId:slug` so switching customers can't leak. */
function parse(raw) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Slugs recorded for one customer. Another customer's entries are invisible. */
export function scopedList(raw, customerId) {
  const prefix = `${customerId}:`;
  return parse(raw)
    .filter((e) => e.startsWith(prefix))
    .map((e) => e.slice(prefix.length));
}

/** Add one slug for one customer, returning the new cookie value. */
export function addScoped(raw, customerId, slug) {
  const entry = `${customerId}:${slug}`;
  const existing = parse(raw);
  if (existing.includes(entry)) return existing.join(",");
  return [...existing, entry].join(",");
}

/**
 * Fold this demo session's actions into a sample customer.
 *
 * Purchases go into `purchased`, which the eligibility engine already subtracts
 * from engagement. Live searches go into `engaged` as `daysAgo: 0` entries —
 * getEligible already keeps the most recent touch per category, so a fresh
 * search here naturally wins over an older sample-data entry for the same
 * category, with no special case needed on either side.
 */
export function applyDemoSession(
  customer,
  { purchased = [], frequent = [], searched = [] } = {},
) {
  if (!customer) return customer;
  const searchedEntries = searched.map((category) => ({
    category,
    daysAgo: 0,
    type: "search",
  }));
  return {
    ...customer,
    purchased: [...new Set([...(customer.purchased ?? []), ...purchased])],
    engaged: [...(customer.engaged ?? []), ...searchedEntries],
    frequent,
    // Kept separate so the UI can tell "bought during this demo" from
    // "arrived with this history", and label the two honestly.
    boughtInDemo: purchased,
  };
}
