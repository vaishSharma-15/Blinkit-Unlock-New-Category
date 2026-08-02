import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProductIndex,
  buildSearchIndex,
  isSearchWorthNudging,
  matchCategory,
  matchProduct,
  matchSearch,
} from "./searchSignal.js";
import catalogue from "../data/products.json" with { type: "json" };

const index = buildSearchIndex(catalogue.categories, catalogue.products);
const productIndex = buildProductIndex(catalogue.products);

test("matches a plain alias word", () => {
  assert.equal(matchCategory("dog", index), "pet-care");
  assert.equal(matchCategory("moist", index), "skincare");
});

test("matches a real product word from the catalogue", () => {
  assert.equal(matchCategory("tomato", index), "grocery");
  assert.equal(matchCategory("pencil", index), "stationery");
});

test("matches as a prefix while still typing", () => {
  assert.equal(matchCategory("note", index), "stationery", "fills in toward notebook");
  assert.equal(matchCategory("choc", index), "snacks");
});

test("below the minimum length, nothing matches — avoids promiscuous 2-char hits", () => {
  assert.equal(matchCategory("p", index), null);
  assert.equal(matchCategory("pe", index), null);
});

test("a query with no relation to the catalogue matches nothing", () => {
  assert.equal(matchCategory("sofa", index), null);
  assert.equal(matchCategory("xyz123", index), null);
});

test("makeup/cosmetics words route to the skincare category, not a specific product", () => {
  // This catalogue doesn't stock makeup, but it does stock skincare basics —
  // the closest real thing on the shelf. matchCategory alone (used by the
  // live-typing panel and as matchSearch's fallback) resolving these to
  // "skincare" is fine and intended, as long as nothing downstream asserts a
  // specific product IS the searched item — see the matchSearch test below,
  // which confirms these resolve as a category match, never a product match.
  for (const term of [
    "makeup", "beauty", "cosmetics", "lipstick", "kajal", "eyeliner",
    "mascara", "foundation", "concealer", "blush", "perfume", "deodorant",
  ]) {
    assert.equal(matchCategory(term, index), "skincare", `"${term}" should route to skincare`);
  }
  // Nail products aren't stocked and aren't in the alias list — these still
  // honestly match nothing.
  for (const term of ["nailpaint", "nailpolish", "nail paint"]) {
    assert.equal(matchCategory(term, index), null, `"${term}" should not match — not actually stocked`);
  }
});

test("genuine skincare basics still match — alongside the makeup vocabulary", () => {
  assert.equal(matchCategory("face wash", index), "skincare");
  assert.equal(matchCategory("moisturiser", index), "skincare");
  assert.equal(matchCategory("sunscreen", index), "skincare");
  assert.equal(matchCategory("serum", index), "skincare");
});

test("chicken and egg, typed alone, no longer falsely route to Pet Care", () => {
  // Found while widening the makeup vocabulary: the only products with these
  // words are dog-food names, so a grocery shopper typing "egg" was being
  // sent to Pet Care. Pulling the word doesn't lose the product — see next.
  assert.equal(matchCategory("chicken", index), null);
  assert.equal(matchCategory("egg", index), null);
});

test("the pet-food products are still findable without the ambiguous words", () => {
  assert.equal(matchCategory("pedigree", index), "pet-care");
  assert.equal(matchCategory("drools", index), "pet-care");
  assert.equal(matchCategory("dog food", index), "pet-care");
});

test("bare 'shampoo' means skincare, not the pet shampoo product", () => {
  // Found while investigating the makeup report: the only literal "shampoo"
  // in the catalogue is Himalaya's pet shampoo, so a naive index sent every
  // shampoo search to Pet Care. That's a wrong nudge, worse than none.
  assert.equal(matchCategory("shampoo", index), "skincare");
});

test("a real multi-word search still reaches pet-care through 'pet'", () => {
  // The fix for the shampoo mismatch must not break the case it came from.
  assert.equal(matchCategory("pet shampoo", index), "pet-care");
});

test("nail paint / nail polish honestly match nothing, with or without the space", () => {
  // Superseded by the makeup-vocabulary removal above: nail products aren't
  // stocked here either, so neither spelling should match.
  assert.equal(matchCategory("nailpaint", index), null);
  assert.equal(matchCategory("nail paint", index), null);
  assert.equal(matchCategory("nail", index), null);
});

test("multi-word phrases match — the way people actually search", () => {
  assert.equal(matchCategory("face wash", index), "skincare");
  assert.equal(matchCategory("dog food", index), "pet-care");
  assert.equal(matchCategory("dish washing liquid", index), "household");
});

test("case and surrounding whitespace don't matter", () => {
  assert.equal(matchCategory("  DoG  ", index), "pet-care");
});

test("isSearchWorthNudging: MAC + not purchased → true", () => {
  assert.equal(
    isSearchWorthNudging({ slug: "pet-care", purchased: ["grocery"], isMac: true }),
    true,
  );
});

test("isSearchWorthNudging: not a MAC → false however clear the match", () => {
  assert.equal(
    isSearchWorthNudging({ slug: "pet-care", purchased: [], isMac: false }),
    false,
  );
});

test("isSearchWorthNudging: already purchased that category → false", () => {
  assert.equal(
    isSearchWorthNudging({ slug: "grocery", purchased: ["grocery"], isMac: true }),
    false,
  );
});

test("isSearchWorthNudging: no match at all → false", () => {
  assert.equal(isSearchWorthNudging({ slug: null, purchased: [], isMac: true }), false);
});

test("'cat food' finds the actual cat product, not whichever dog product is listed first", () => {
  // The reported bug: the category page always showed products[0] (a dog
  // food) regardless of what was searched. This is the fix — the search
  // itself must resolve to the right specific product.
  const hit = matchProduct("cat food", productIndex);
  assert.equal(hit.id, "pet-003", "Whiskas Junior Ocean Fish Cat Food");
});

test("'dog food' finds a real dog product (not the cat product)", () => {
  const hit = matchProduct("dog food", productIndex);
  assert.ok(["pet-001", "pet-002"].includes(hit.id));
});

test("a product's own name finds it directly", () => {
  assert.equal(matchProduct("vitamin c serum", productIndex).id, "skn-001");
  assert.equal(matchProduct("gentle cleanser", productIndex).id, "skn-002");
  assert.equal(matchProduct("sunscreen lotion", productIndex).id, "skn-003");
});

test("daily grocery essentials — the reported 'bread' gap and its neighbours", () => {
  // "bread" used to be a genuinely unstocked term (grocery had only tomato,
  // milk, atta, and oil). Same fix shape as plants/knife/bandage: add the
  // real product, not a fake match.
  assert.equal(matchProduct("bread", productIndex)?.id, "gro-005");
  assert.equal(matchProduct("basmati rice", productIndex)?.id, "gro-006");
  assert.equal(matchProduct("salt", productIndex)?.id, "gro-007");
  assert.equal(matchProduct("sugar", productIndex)?.id, "gro-008");
  assert.equal(matchProduct("toor dal", productIndex)?.id, "gro-011");
  assert.equal(matchProduct("tea", productIndex)?.id, "gro-012");
});

test("loose onion and potato are findable through the category alias, same as tomato", () => {
  const idx = { categoryIndex: index, productIndex };
  assert.deepEqual(matchSearch("onion", idx), { type: "product", productId: "gro-009", categorySlug: "grocery" });
  assert.deepEqual(matchSearch("potato", idx), { type: "product", productId: "gro-010", categorySlug: "grocery" });
});

test("one incidental word out of many is too weak to claim a specific product match", () => {
  // The reported bug: "mama earth face wash" — a real competitor product
  // this catalogue doesn't stock — matched the Vitamin C Serum on "face"
  // alone (1 of 4 words), and the Unlock card then presented that unrelated
  // product's own data as if it answered the search. Majority-word matches
  // still work fine; a single stray overlap out of several unrelated words
  // must not.
  assert.equal(matchProduct("mama earth face wash", productIndex), null);
  assert.equal(matchProduct("himalaya baby face wash", productIndex), null);
  // Still works: short queries where the matched word(s) are the majority.
  assert.equal(matchProduct("face wash", productIndex)?.id, "skn-001");
  assert.equal(matchProduct("face", productIndex)?.id, "skn-001");
});

test("matchSearch prefers a specific product over a bare category match", () => {
  const idx = { categoryIndex: index, productIndex };
  const hit = matchSearch("cat food", idx);
  assert.deepEqual(hit, { type: "product", productId: "pet-003", categorySlug: "pet-care" });
});

test("matchSearch falls back to category when nothing product-specific matches", () => {
  const idx = { categoryIndex: index, productIndex };
  const hit = matchSearch("skincare", idx);
  assert.deepEqual(hit, { type: "category", categorySlug: "skincare" });
});

test("matchSearch returns null for a genuinely unstocked item", () => {
  const idx = { categoryIndex: index, productIndex };
  assert.equal(matchSearch("nailpaint", idx), null);
  assert.equal(matchSearch("xyz123", idx), null);
});

test("'plants', 'knife', 'bandage' now resolve to real stocked categories", () => {
  // These were the reported "I can't proceed" cases — "plants" specifically
  // was a genuinely unstocked term when that report came in. The fix wasn't
  // to fake a match; it was to add real categories with real products behind
  // them (Ugaoo Money Plant, Pigeon Kitchen Knife, Band-Aid), the same way
  // every other category in this catalogue is built.
  const idx = { categoryIndex: index, productIndex };
  assert.deepEqual(matchSearch("plants", idx), { type: "category", categorySlug: "garden" });
  assert.deepEqual(matchSearch("knife", idx), {
    type: "product",
    productId: "kit-001",
    categorySlug: "kitchenware",
  });
  // "Bandage" doesn't literally appear in "Band-Aid" once split into words
  // ("band" + "aid"), so this resolves through the category alias rather
  // than the product-name match — still lands on the real pharmacy category,
  // whose only product (Band-Aid) is what the Unlock card then shows.
  assert.deepEqual(matchSearch("bandage", idx), { type: "category", categorySlug: "pharmacy" });
});

test("realistic item words for the newer categories all reach the right category", () => {
  // Nobody in this catalogue stocks a mixer, a pan, or cut flowers — same
  // shape as "blush" earlier: these honestly resolve to the closest real
  // stocked category (its one real product), never a fabricated specific
  // match. "notebook"/"pen" do have real stocked products behind them.
  const idx = { categoryIndex: index, productIndex };
  assert.deepEqual(matchSearch("mixer", idx), { type: "category", categorySlug: "kitchenware" });
  assert.deepEqual(matchSearch("pan", idx), { type: "category", categorySlug: "kitchenware" });
  assert.deepEqual(matchSearch("cookware", idx), { type: "category", categorySlug: "kitchenware" });
  assert.deepEqual(matchSearch("flowers", idx), { type: "category", categorySlug: "garden" });
  assert.deepEqual(matchSearch("notebook", idx), {
    type: "product",
    productId: "stn-001",
    categorySlug: "stationery",
  });
  assert.deepEqual(matchSearch("detergent", idx), { type: "category", categorySlug: "household" });
});

test("matchSearch resolves makeup words to the skincare category, never to a specific product", () => {
  // No product in this catalogue is named "blush" — matchProduct scores it
  // 0 for every product, so matchSearch falls through to the category match.
  // The Unlock card that follows shows a real skincare product on its own
  // honest terms, not one falsely presented as the searched-for item.
  const idx = { categoryIndex: index, productIndex };
  const hit = matchSearch("blush", idx);
  assert.deepEqual(hit, { type: "category", categorySlug: "skincare" });
});

test("a named competitor product this catalogue doesn't stock honestly matches nothing at all", () => {
  // The reported bug, one level up from matchProduct alone: "mama earth face
  // wash" used to still resolve to the Skincare *category* (through the one
  // shared word "face"), so the Unlock card substituted the Vitamin C Serum
  // as if it were a genuine answer. That's the same failure shape as the
  // original cat-food bug, just one layer further down the fallback chain —
  // matchSearch must not paper over "we don't stock this" by handing back a
  // different specific product wearing a small disclaimer.
  const idx = { categoryIndex: index, productIndex };
  assert.equal(matchSearch("mama earth face wash", idx), null);
  assert.equal(matchSearch("himalaya baby face wash", idx), null);
});

test("genuine multi-word category phrasing still resolves — only weak single-word overlaps were the problem", () => {
  // These describe an actual category, not a specific competitor product —
  // most or all of their words genuinely relate to what's stocked there, so
  // they should keep working exactly as before.
  const idx = { categoryIndex: index, productIndex };
  assert.deepEqual(matchSearch("home garden", idx), { type: "category", categorySlug: "garden" });
  assert.deepEqual(matchSearch("dish washing liquid", idx), {
    type: "category",
    categorySlug: "household",
  });
});
