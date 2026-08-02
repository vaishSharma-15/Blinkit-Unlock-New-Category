/**
 * Turns what a customer types into a category match — pure string logic, no
 * AI, no network, same spirit as the eligibility engine: deciding *which*
 * category a query points at is a lookup problem, not a model call. AI's job
 * starts only once they land on that category's Unlock card, grounded in real
 * reviews and order stats — not before, and not on every keystroke.
 *
 * A live search is treated as a genuine engagement signal, exactly as strong
 * as a searched-three-days-ago entry from sample history — arguably stronger,
 * since it is happening right now with the customer looking at the screen.
 */

/**
 * Natural words a customer would type that don't appear verbatim in any
 * product name — "dog" for pet-care, "face wash" for skincare.
 */
const ALIASES = {
  "pet-care": ["pet", "pets", "dog", "dogs", "puppy", "cat", "cats", "treats"],
  skincare: [
    "skincare",
    "skin",
    "face",
    "facewash",
    "moisturiser",
    "moisturizer",
    "sunscreen",
    "serum",
    "cleanser",
    // "Shampoo" defaults here rather than to pet-care, even though the only
    // literal shampoo product in the catalogue is Himalaya's pet shampoo — see
    // the STOPWORDS note below for why that word is kept out of pet-care's
    // auto-extracted terms. "pet shampoo" still reaches pet-care correctly,
    // through the word "pet".
    "shampoo",
    // Makeup/beauty words. This catalogue's real skincare stock is basics
    // only (serum, cleanser, sunscreen, moisturiser) — there is no lipstick
    // or foundation to sell. These words used to be excluded entirely on the
    // reasoning that routing "blush" here was misleading; the flaw in that
    // reasoning was conflating two different things. matchProduct never
    // matches any of these words against a real product name (no product
    // here is named "blush"), so a search for one of these words resolves as
    // a *category* match, not a product match — matchSearch falls through to
    // matchCategory. The destination is "New for you: Skincare", the general
    // category, never a specific product asserted to be makeup. What the
    // customer lands on is a real skincare product shown honestly on its own
    // terms (its own order data, its own verified reviews) — not a false
    // claim that it's the thing they searched for, just the closest real
    // stock to browse. If matchProduct's scoring ever changes to fuzzy-match
    // these against product names, re-check this reasoning still holds.
    "makeup",
    "beauty",
    "cosmetic",
    "cosmetics",
    "lipstick",
    "kajal",
    "mascara",
    "foundation",
    "blush",
    "blusher",
    "concealer",
    "compact",
    "eyeliner",
    "perfume",
    "deodorant",
  ],
  stationery: [
    "stationery",
    "notebook",
    "notebooks",
    "pen",
    "pens",
    "pencil",
    "pencils",
    "book",
    "books",
    "glue",
  ],
  household: [
    "household",
    "cleaning",
    "detergent",
    "dishwash",
    "mop",
    "mosquito",
    "toilet",
  ],
  snacks: ["snacks", "chips", "biscuit", "biscuits", "chocolate", "namkeen"],
  grocery: [
    "grocery",
    "groceries",
    "vegetable",
    "vegetables",
    "milk",
    "atta",
    "flour",
    "oil",
    "tomato",
    "bread",
    "rice",
    "salt",
    "sugar",
    "onion",
    "onions",
    "potato",
    "potatoes",
    "dal",
    "daal",
    "pulses",
    "tea",
    "chai",
  ],
  kitchenware: [
    "kitchenware",
    "kitchen",
    "knife",
    "knives",
    "mixer",
    "grinder",
    "pan",
    "pans",
    "cookware",
    "utensil",
    "utensils",
    "vessel",
    "vessels",
    "cutlery",
  ],
  pharmacy: [
    "pharmacy",
    "medicine",
    "medicines",
    "bandage",
    "bandages",
    "firstaid",
  ],
  garden: [
    "garden",
    "gardening",
    "plant",
    "plants",
    "nursery",
    "flower",
    "flowers",
    "sapling",
    "saplings",
  ],
  electronics: [
    "electronics",
    "electronic",
    "earbud",
    "earbuds",
    "earphone",
    "earphones",
    "headphone",
    "headphones",
    "powerbank",
    "charger",
    "chargers",
    "cable",
    "cables",
    "gadget",
    "gadgets",
  ],
};

/**
 * Units and filler that show up in product names but were never searched for
 * — plus everyday ingredient words that would be actively misleading if
 * auto-indexed under whichever single product happens to contain them.
 *
 * "chicken" and "egg" are the case that motivates this: the only products
 * with those words are "Pedigree Puppy Dry Dog Food Chicken & Milk" and
 * "Drools Adult Dog Food Chicken & Egg", so a customer typing "egg" — almost
 * certainly meaning groceries — was being confidently routed to Pet Care.
 * "shampoo" is the same shape of bug for the same reason: it's the pet
 * shampoo's name, and nothing else's.
 *
 * Pulling a word here doesn't lose the *product* it names — Pedigree and
 * Drools are still findable through "pet", "dog", or "pedigree" itself. It
 * only stops that one ambiguous ingredient word from acting as a category
 * signal on its own.
 */
const STOPWORDS = new Set([
  "ml", "kg", "gm", "pack", "of", "the", "and", "for", "with",
  "shampoo", "chicken", "egg",
]);

export function wordsOf(text) {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/**
 * Build a slug → search-term list from the live catalogue: category name, its
 * manual aliases above, and every real product name in that category. Reading
 * product names in means the index can never drift out of sync with what's
 * actually on sale — add a product, its words are searchable immediately.
 */
export function buildSearchIndex(categories, products) {
  return categories.map((category) => {
    const ownProducts = products.filter((p) => p.category === category.slug);
    const terms = new Set([
      ...wordsOf(category.name),
      ...(ALIASES[category.slug] ?? []),
      ...ownProducts.flatMap((p) => wordsOf(p.name)),
    ]);
    return { slug: category.slug, terms: [...terms] };
  });
}

/**
 * Which category, if any, does this query point at?
 *
 * Tokenized, because real searches are phrases — "face wash", "dog food",
 * "pet shampoo" — not single words, and the terms indexed are all single
 * words. Every word the customer typed (3+ characters) gets checked against
 * every category; a category matches if any of its terms is a prefix of any
 * typed word. "pet shampoo" matches pet-care through "pet" even though
 * "shampoo" itself is deliberately not indexed there (see STOPWORDS).
 *
 * Below `minLength` a word is ignored — two characters is too promiscuous
 * ("pe" would hit pet, pen, and pencil at once).
 *
 * On genuine ambiguity this returns the first hit in catalogue order. Not a
 * concern for this six-category catalogue; would need real disambiguation in
 * a bigger one.
 */
export function matchCategory(query, index, { minLength = 3 } = {}) {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= minLength);
  if (words.length === 0) return null;

  const hit = index.find((entry) =>
    entry.terms.some((term) => words.some((word) => term.startsWith(word))),
  );
  return hit?.slug ?? null;
}

/**
 * Build a product → search-term list from each product's own name, so a
 * search can be checked against specific products, not just categories.
 */
export function buildProductIndex(products) {
  return products.map((p) => ({
    id: p.id,
    category: p.category,
    terms: [...new Set(wordsOf(p.name))],
  }));
}

/**
 * Which specific product, if any, does this query point at?
 *
 * This is the fix for a real bug: the category match alone told the Unlock
 * card *which category* to open, but the card always showed that category's
 * first product regardless of what was actually typed — so "cat food" and
 * "dog food" landed on the identical card, and every skincare search showed
 * the same serum. Scored by how many typed words a product's own name
 * matches, so "cat food" (matching both "cat" and "food") beats a dog-food
 * product that only matches "food" — the word that actually disambiguates
 * wins, not whichever product happens to be listed first.
 *
 * Ties (two real dog-food products, both matching "dog" and "food" equally)
 * resolve to catalogue order — a coin flip between two genuinely relevant
 * products is a fair outcome; it's the cat/dog case that had to be fixed.
 */
export function matchProduct(query, productIndex, { minLength = 3 } = {}) {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= minLength);
  if (words.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const entry of productIndex) {
    const score = words.filter((word) =>
      entry.terms.some((term) => term.startsWith(word)),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (!best) return null;

  // Require the *majority* of the customer's own words to land on this one
  // product before treating it as an identified match. Without this, "mama
  // earth face wash" — a real competitor product this catalogue doesn't
  // stock — matched the Vitamin C Serum on the strength of "face" alone, one
  // word out of four, and the Unlock card then presented that unrelated
  // product's own order data as if it were the answer to what was actually
  // typed. A single incidental overlap is too weak a basis for a specific-
  // product claim; matchSearch's category fallback (no such claim, just "you
  // haven't shopped skincare before") is the honest outcome for a query like
  // this, same as it already is for "blush".
  const threshold = Math.ceil(words.length / 2);
  if (bestScore < threshold) return null;

  return best;
}

/**
 * The same majority-word requirement as matchProduct, applied to the
 * category index instead — used only by matchSearch's fallback step, below.
 *
 * matchCategory itself stays unscored (any single word is enough) because
 * that's the right behaviour for its own direct callers. But when it's used
 * as matchSearch's *fallback*, an unscored hit caused a real bug: "mama
 * earth face wash" — a specific, real competitor product this catalogue
 * doesn't stock — shares only the word "face" with Skincare, out of four
 * typed words, and that one incidental overlap was enough to present the
 * Vitamin C Serum as if it were a genuine answer to the search. A customer
 * who searches a specific product they know we don't sell needs to be told
 * that plainly, not shown an unrelated substitute with a small caption
 * explaining it isn't really a match — the substitution itself is what reads
 * as broken, however it's labelled.
 *
 * Requiring the majority of typed words to land on the category keeps every
 * legitimate case working — "blush" and "makeup" are entirely their one
 * matched word, "home garden" and "dish washing liquid" clear the bar on
 * genuine overlap — while a multi-word query that only glances off a
 * category through one unrelated word now honestly matches nothing.
 */
function scoredCategoryMatch(query, index, { minLength = 3 } = {}) {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= minLength);
  if (words.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const entry of index) {
    const score = words.filter((word) =>
      entry.terms.some((term) => term.startsWith(word)),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (!best) return null;

  const threshold = Math.ceil(words.length / 2);
  if (bestScore < threshold) return null;

  return best.slug;
}

/**
 * The single entry point a search box should call: try to pin down a
 * specific product first, and only fall back to a bare category match if
 * nothing product-level fits. Typing a product's own name (or close to it)
 * should feel more precise than typing a generic category word, and this is
 * what makes that true.
 */
export function matchSearch(query, { categoryIndex, productIndex }) {
  const product = matchProduct(query, productIndex);
  if (product) {
    return { type: "product", productId: product.id, categorySlug: product.category };
  }
  const categorySlug = scoredCategoryMatch(query, categoryIndex);
  if (categorySlug) {
    return { type: "category", categorySlug };
  }
  return null;
}

/**
 * Should a live search for this category surface the nudge?
 *
 * Same trust rule as the rest of the feature: only a Monthly Active Customer
 * sees it, and only for a category they haven't already bought from. A search
 * for something they already buy regularly isn't a new-category signal — it's
 * just shopping.
 */
export function isSearchWorthNudging({ slug, purchased = [], isMac }) {
  return Boolean(slug) && Boolean(isMac) && !purchased.includes(slug);
}
