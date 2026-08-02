/**
 * Eligibility engine — decides which categories a customer may be nudged
 * toward. Pure functions: no network, no AI, no imports, no I/O.
 *
 * The rule the whole feature rests on:
 *
 *     engaged categories − purchased categories = eligible
 *
 * Everything here operates on one customer's own history. It never reads,
 * aggregates, or compares against any other customer — recommendation by
 * similarity was tested in research and rejected for this problem.
 */

/** A customer counts as Monthly Active if they ordered within this window. */
export const MAC_WINDOW_DAYS = 30;

/** Engagement older than this is shown honestly as an old signal, not a recent one. */
export const ENGAGEMENT_LOOKBACK_DAYS = 90;

/** Engagement older than this no longer counts as real interest at all. */
export const STALE_LOOKBACK_DAYS = 365;

/**
 * Has this customer ordered recently enough to count as a MAC?
 *
 * The feature exists to move the share of MACs who explore, so a lapsed
 * customer never sees it however strong their engagement signal is.
 */
export function isMAC(customer, { windowDays = MAC_WINDOW_DAYS } = {}) {
  const days = customer?.lastOrderDaysAgo;
  return typeof days === "number" && days >= 0 && days <= windowDays;
}

/**
 * Categories this customer engaged with but never bought from.
 *
 * Returns `[{ category, daysAgo, type, stale }]`, most recent first. Returns
 * every eligible category — trimming to fit the UI is the component's
 * decision, not this engine's.
 *
 * `stale: true` marks engagement older than `lookbackDays` (still real
 * interest, still never bought — just not recent). The UI must say so
 * honestly rather than word it like a recent search. Anything older than
 * `staleLookbackDays` is dropped entirely as too old to be meaningful.
 *
 * Returns `[]` (never a fallback or generic suggestion) when the customer
 * isn't a MAC, has no engagement, or has already bought everything they
 * looked at. No signal means no feature.
 *
 * @param customer
 * @param {object} [options]
 * @param {string[]} [options.availableCategories] Restrict to categories that
 *   actually have products. A nudge into an empty category destroys trust, so
 *   pass the catalogue's slugs when you have them.
 * @param {number} [options.lookbackDays]
 * @param {number} [options.staleLookbackDays]
 */
export function getEligible(
  customer,
  {
    availableCategories,
    lookbackDays = ENGAGEMENT_LOOKBACK_DAYS,
    staleLookbackDays = STALE_LOOKBACK_DAYS,
    windowDays = MAC_WINDOW_DAYS,
  } = {},
) {
  if (!isMAC(customer, { windowDays })) return [];

  const purchased = new Set(customer.purchased ?? []);
  const stocked = availableCategories ? new Set(availableCategories) : null;

  const relevant = (customer.engaged ?? []).filter((e) => {
    if (!e?.category) return false;
    if (typeof e.daysAgo !== "number" || e.daysAgo < 0) return false;
    if (e.daysAgo > staleLookbackDays) return false;
    if (purchased.has(e.category)) return false;
    if (stocked && !stocked.has(e.category)) return false;
    return true;
  });

  // A customer can search the same category more than once. Keep the most
  // recent touch per category so recency ranking stays meaningful.
  const mostRecent = new Map();
  for (const entry of relevant) {
    const seen = mostRecent.get(entry.category);
    if (!seen || entry.daysAgo < seen.daysAgo) {
      mostRecent.set(entry.category, entry);
    }
  }

  return [...mostRecent.values()]
    .map((entry) => ({ ...entry, stale: entry.daysAgo > lookbackDays }))
    .sort((a, b) => a.daysAgo - b.daysAgo);
}

/**
 * Order eligible categories for display: most recent first.
 *
 * When two are equally recent — the "searched pet care and skincare on the
 * same day" case — fall back to whichever has less quality-complaint volume,
 * on the grounds that trust is easier to earn there.
 *
 * That tie-break is a last resort for when the UI genuinely has one slot. It
 * is not permission to reduce a multi-category customer to a single entry;
 * show them all when there's room.
 *
 * @param {Array} eligible Output of getEligible.
 * @param {object} [options]
 * @param {Record<string, number>} [options.complaintVolume] slug → complaint count.
 */
export function rankEligible(eligible, { complaintVolume = {} } = {}) {
  return [...eligible].sort((a, b) => {
    if (a.daysAgo !== b.daysAgo) return a.daysAgo - b.daysAgo;

    const aComplaints = complaintVolume[a.category] ?? 0;
    const bComplaints = complaintVolume[b.category] ?? 0;
    if (aComplaints !== bComplaints) return aComplaints - bComplaints;

    // Fully tied: alphabetical, so the order is at least stable across renders.
    return a.category.localeCompare(b.category);
  });
}
