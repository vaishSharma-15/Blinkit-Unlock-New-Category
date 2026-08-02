/**
 * Search-bar nudge copy. Pure string assembly — no AI.
 *
 * A nudge is only ever built from one customer's own engagement, and it always
 * carries the sparkle. Generic placeholders stay plain: the sparkle is a
 * promise that this line came from something the customer actually did.
 *
 * The signal lives in a persistent chip beside the search field rather than in
 * the rotating placeholder. It used to rotate, and rotating lost it — a nudge
 * you have to catch within a few seconds is a nudge most people never see, and
 * it is the only route into the category.
 */

/** What every customer sees. The control state, unchanged since Phase 1. */
export const GENERIC_SUGGESTIONS = [
  'Search "milk"',
  'Search "bread"',
  'Search "eggs"',
  'Search "stationery"',
  'Search "chips"',
];

/**
 * The thing a customer would say they were looking at, not the category name.
 * "dog treats" is what they searched; "Pet Care" is our shelf label.
 */
// Must name whatever the Unlock card actually features for a category-level
// signal (no specific product searched) — the first product listed for that
// category in data/products.json. Saying "face wash" and then showing a
// vitamin C serum is the same broken promise as the original mismatched-
// product bugs this app was built to avoid, just moved into the chip copy.
const NOUNS = {
  "pet-care": "dog food",
  skincare: "face serum",
  stationery: "notebooks",
  household: "cleaning supplies",
  snacks: "chips",
  grocery: "fresh veg",
};

function noun(slug, categoryName) {
  return NOUNS[slug] ?? (categoryName ?? slug).toLowerCase();
}

/**
 * The full sentence. Searching is a stronger, more deliberate signal than
 * browsing, so the two get different words.
 *
 * A stale entry (see lib/eligibility.js) is still real, still-unbought
 * interest — but "still thinking about" or "continue your last search" would
 * imply it just happened, which isn't true for something months old. That
 * case gets its own honest, non-recency wording instead.
 *
 * Still used as the chip's accessible label — the short form is a visual
 * abbreviation, and a screen reader should get the whole thought.
 */
export function nudgeText({ category, type, stale }, categoryName) {
  const thing = noun(category, categoryName);
  if (stale) return `You looked at ${thing} a while back — worth another look?`;
  return type === "browse"
    ? `Still thinking about ${thing}?`
    : `Wanna continue your last search — ${thing}?`;
}

/**
 * The chip version: two or three words, because it has to sit beside a search
 * field on a phone without crowding out the field itself.
 */
export function shortNudgeText({ category }, categoryName) {
  const thing = noun(category, categoryName);
  return thing.charAt(0).toUpperCase() + thing.slice(1);
}

/**
 * Build the persistent nudges — one per eligible category, ranked order
 * preserved.
 *
 * Returns `[]` for a customer with no signal, and the UI renders no chip at
 * all in that case. No fallback, no generic stand-in: the chip appearing at
 * all is itself the claim that we have a reason.
 *
 * @param {Array} eligible Output of getEligible / rankEligible.
 * @param {Array} categories Catalogue categories, for display names.
 * @returns {Array<{category: string, short: string, label: string, href: string}>}
 */
export function buildNudges(eligible = [], categories = []) {
  const nameOf = new Map(categories.map((c) => [c.slug, c.name]));

  return eligible.map((entry) => {
    const name = nameOf.get(entry.category);
    return {
      category: entry.category,
      short: shortNudgeText(entry, name),
      label: nudgeText(entry, name),
      href: `/category/${entry.category}`,
    };
  });
}
