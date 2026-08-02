import categoryReviews from "../data/categoryReviews.json" with { type: "json" };
import catalogue from "../data/products.json" with { type: "json" };

/**
 * Real Blinkit review text, extracted from the 26k-review corpus built in an
 * earlier phase of this project. Category-level, not product-level — that's
 * what actually exists, and no amount of filtering here invents the
 * per-product granularity the real corpus doesn't have.
 *
 * getProductReviews requires a review to actually name the product's own
 * brand before it's allowed to ground anything said about that product. This
 * is deliberately strict, and correctly leaves most products with zero
 * matched reviews — this catalogue's 24 products get real name-checks in only
 * a handful of the category's real reviews, and pretending otherwise (by
 * falling back to "well, it's roughly the same category") is exactly the
 * behaviour that let a review about someone else's cat food read as if it
 * were about a customer's own dog food. No match means the AI leans on order
 * stats alone for that product, which are always genuinely its own.
 */

/**
 * The one identifying word per product that's worth checking review text
 * against — almost always the brand. Hand-maintained rather than derived
 * from the product name automatically: an auto-extracted "good" (from "Good
 * Knight") or "fresh" (from "Fresh Tomato") would false-positive on ordinary
 * praise ("good service", "fresh delivery") the instant it appeared in any
 * unrelated review. A short, audited list catches real mentions without that
 * failure mode — worth the maintenance cost at this catalogue's size.
 */
const PRODUCT_BRAND = {
  "pet-001": ["pedigree"],
  "pet-002": ["drools"],
  "pet-003": ["whiskas"],
  "pet-004": ["himalaya"],
  "skn-001": ["minimalist"],
  "skn-002": ["cetaphil"],
  "skn-003": ["lakme", "lakmé"],
  "skn-004": ["nivea"],
  "stn-001": ["classmate"],
  "stn-002": ["cello"],
  "stn-003": ["faber-castell", "faber castell"],
  "stn-004": ["fevicol"],
  "hou-001": ["surf excel", "surf"],
  "hou-002": ["vim"],
  "hou-003": ["harpic"],
  "hou-004": ["good knight"],
};

/**
 * Sub-types that share a category but are not interchangeable. Kept as a
 * second, independent check even with brand-matching in place: "I ordered
 * Drools cat food" names the right brand (Drools) for the wrong species
 * (this catalogue's Drools product is dog food) — a real review, about a
 * real brand, that is still not about this product. Brand match is
 * necessary but not sufficient.
 */
const CONFLICT_GROUPS = [
  ["dog", "dogs", "puppy", "puppies"],
  ["cat", "cats", "kitten", "kittens"],
];

function ownConflictGroup(productName) {
  const name = productName.toLowerCase();
  return CONFLICT_GROUPS.find((group) => group.some((word) => name.includes(word)));
}

function mentionsConflictingGroup(reviewText, own) {
  if (!own) return false; // Product declares no sub-type — nothing to conflict with.
  const text = reviewText.toLowerCase();
  return CONFLICT_GROUPS.some(
    (group) => group !== own && group.some((word) => text.includes(word)),
  );
}

function mentionsBrand(reviewText, productId) {
  const brands = PRODUCT_BRAND[productId];
  if (!brands) return false;
  const text = reviewText.toLowerCase();
  return brands.some((brand) => text.includes(brand));
}

/**
 * A review can name this product's brand while making no claim about the
 * product at all — e.g. a complaint that Blinkit's own return policy refused
 * a replacement for an accidental duplicate order. That's a dispute with
 * Blinkit's service, not evidence about the product, and it's actively
 * misleading to show it here: this card makes its own, different promise
 * ("first time in this category? free return within 24 hours, no questions
 * asked"), and a review about a *different* return being refused reads as if
 * it contradicts that guarantee, even though it says nothing about whether
 * this product itself is any good.
 *
 * Narrow on purpose — "policy" plus a refusal word. Checked against the full
 * review corpus: this catches only genuine own-policy disputes, not reviews
 * describing a real product defect (a dirty or expired item, a hollow toy),
 * which don't happen to use the word "policy" for why the return was denied.
 */
function isOwnPolicyDispute(reviewText) {
  return /polic(y|ies)/i.test(reviewText) && /refus|den(y|ied)|reject/i.test(reviewText);
}

/**
 * Interleave praise and criticism so a truncated list can't accidentally
 * become one-sided, then cut to `limit`.
 *
 * Sort order matters more than it looks: each side is ordered strongest-
 * signal-first (best praise, harshest criticism) so that truncating to
 * `limit` keeps the most informative reviews from both. Sorting both
 * descending silently dropped every 1-star review — the model then couldn't
 * report a tension it had never been shown.
 */
function interleave(reviews, limit) {
  const positive = reviews
    .filter((r) => (r.rating ?? 0) >= 4)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const critical = reviews
    .filter((r) => (r.rating ?? 0) < 4)
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));

  const mixed = [];
  for (let i = 0; i < Math.max(positive.length, critical.length); i++) {
    if (positive[i]) mixed.push(positive[i]);
    if (critical[i]) mixed.push(critical[i]);
  }

  return mixed.slice(0, limit);
}

/**
 * Reviews for the category as a whole, unfiltered by product. Kept for
 * anything that genuinely wants category-wide sentiment rather than one
 * product's view of it — not used by the summary or ask routes any more;
 * see getProductReviews.
 */
export function getCategoryReviews(categorySlug, limit = 10) {
  return interleave(categoryReviews[categorySlug] ?? [], limit);
}

/**
 * Reviews to ground a summary or answer about one specific product —
 * strictly: a review only qualifies if it names this product's own brand,
 * and doesn't name a conflicting sub-type (the Drools cat/dog trap). No
 * loose "same category, presumably close enough" fallback. Most products
 * will get zero reviews back, honestly, because the real corpus mostly
 * doesn't mention this catalogue's specific SKUs by name — that's the
 * correct behaviour, not a bug to work around.
 */
export function getProductReviews(product, limit = 10) {
  const all = categoryReviews[product.category] ?? [];
  const own = ownConflictGroup(product.name);
  const relevant = all.filter(
    (r) =>
      mentionsBrand(r.text, product.id) &&
      !mentionsConflictingGroup(r.text, own) &&
      !isOwnPolicyDispute(r.text),
  );
  return interleave(relevant, limit);
}

export function reviewCounts(categorySlug) {
  const all = categoryReviews[categorySlug] ?? [];
  return {
    total: all.length,
    positive: all.filter((r) => (r.rating ?? 0) >= 4).length,
    critical: all.filter((r) => (r.rating ?? 0) < 4).length,
  };
}

/**
 * Every review in this category that matched no product's brand at all —
 * genuinely unattributable, category-wide colour (pricing, delivery,
 * general app sentiment). Not used to ground any one product's card; exists
 * so that gap is visible and auditable rather than silently absorbed into
 * whichever product happened to be on screen.
 */
export function unattributedReviews(categorySlug) {
  const all = categoryReviews[categorySlug] ?? [];
  const productsInCategory = catalogue.products.filter(
    (p) => p.category === categorySlug,
  );
  // Same three-part test as getProductReviews: a review only counts as
  // "attributed" if it clears every check for some product in the category.
  // Using brand-match alone here would make the Drools/cat-food review count
  // as "attributed" to the Drools dog-food product, or an own-policy dispute
  // count as "attributed" to whichever brand it happened to name, when both
  // are actually excluded from grounding anything in this catalogue — they'd
  // vanish from both this list and every product's own results at once.
  return all.filter(
    (r) =>
      isOwnPolicyDispute(r.text) ||
      !productsInCategory.some((p) => {
        const own = ownConflictGroup(p.name);
        return mentionsBrand(r.text, p.id) && !mentionsConflictingGroup(r.text, own);
      }),
  );
}
