import test from "node:test";
import assert from "node:assert/strict";

import {
  getCategoryReviews,
  getProductReviews,
  reviewCounts,
  unattributedReviews,
} from "./reviews.js";
import catalogue from "../data/products.json" with { type: "json" };

const product = (id) => catalogue.products.find((p) => p.id === id);

test("a review must name the product's own brand to ground it — no loose category fallback", () => {
  // Minimalist Vitamin C Serum. The skincare corpus has 18 reviews; only one
  // names "Minimalist". Every other skincare review — about Plum, Nivea,
  // Garnier, or nothing specific — must be excluded, not treated as
  // close-enough colour for this product.
  const reviews = getProductReviews(product("skn-001"), 20);
  assert.equal(reviews.length, 1);
  assert.match(reviews[0].text, /minimalist/i);
});

test("a review that names the brand but makes no claim about the product is excluded", () => {
  // The skincare corpus's only Nivea mention is a complaint that Blinkit's
  // own return policy refused a replacement for an accidentally duplicated
  // order — it says nothing about whether the Nivea moisturiser itself is
  // any good, and showing it would contradict this card's own "no questions
  // asked" return guarantee. Brand-match alone would wrongly ground this
  // product on it; the policy-dispute check must exclude it, leaving Nivea
  // with the same honest zero as every other unmatched product.
  assert.deepEqual(getProductReviews(product("skn-004"), 20), []);
});

test("most products in this catalogue genuinely have zero matched reviews", () => {
  // The honest state of the real corpus: most SKUs are never named. A
  // product with no brand-matched review must return an empty list, not
  // fall back to category-wide sentiment about products it isn't.
  assert.deepEqual(getProductReviews(product("skn-001"), 20).length, 1); // Minimalist — exactly one real mention
  assert.deepEqual(getProductReviews(product("pet-004"), 20), []); // Himalaya — zero mentions in the corpus
  assert.deepEqual(getProductReviews(product("stn-002"), 20), []); // Cello — zero mentions
  assert.deepEqual(getProductReviews(product("hou-002"), 20), []); // Vim — zero mentions
});

test("the Drools trap: brand match is necessary but not sufficient", () => {
  // Real review text: "I ordered Drools cat food..." Names the right brand
  // for the wrong species — this catalogue's only Drools product is dog
  // food. Brand overlap must not override the species conflict.
  const reviews = getProductReviews(product("pet-002"), 20);
  assert.ok(
    !reviews.some((r) => r.text.includes("Drools cat food")),
    "a Drools review about cat food must not ground the Drools dog-food product",
  );
});

test("a genuinely unrelated brand's review never leaks into a different product", () => {
  // Whiskas' one real review must not appear when grounding Pedigree, and
  // vice versa — same category, different specific products.
  const pedigree = getProductReviews(product("pet-001"), 20);
  const whiskas = getProductReviews(product("pet-003"), 20);
  assert.ok(!pedigree.some((r) => /whiskas/i.test(r.text)));
  assert.ok(!whiskas.some((r) => /pedigree/i.test(r.text)));
});

test("a category with no review data at all returns an empty list, not an error", () => {
  assert.deepEqual(getProductReviews(product("gro-001"), 10), []);
});

test("getProductReviews respects its limit even when more matches exist", () => {
  // Surf Excel has 4 real matched reviews in the corpus.
  const all = getProductReviews(product("hou-001"), 20);
  const capped = getProductReviews(product("hou-001"), 2);
  assert.equal(all.length, 4);
  assert.equal(capped.length, 2);
});

test("reviewCounts and getCategoryReviews stay category-wide — unaffected by product filtering", () => {
  const counts = reviewCounts("pet-care");
  assert.equal(counts.total, counts.positive + counts.critical);
  assert.ok(counts.total > 0);
  assert.equal(getCategoryReviews("pet-care", 20).length, counts.total);
});

test("unattributedReviews surfaces exactly what getProductReviews excludes for every product in the category", () => {
  // Every review in the category is either matched to some product's brand,
  // or shows up here — nothing silently disappears between the two.
  const all = getCategoryReviews("pet-care", 50);
  const matchedAnywhere = catalogue.products
    .filter((p) => p.category === "pet-care")
    .flatMap((p) => getProductReviews(p, 50));
  const unattributed = unattributedReviews("pet-care");
  assert.equal(matchedAnywhere.length + unattributed.length, all.length);
});
