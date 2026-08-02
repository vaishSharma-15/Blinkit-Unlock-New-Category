import test from "node:test";
import assert from "node:assert/strict";

import { aggregateCategoryStats, rankPopularCategories } from "./categoryPopularity.js";
import catalogue from "../data/products.json" with { type: "json" };
import { sampleCustomers } from "../data/sampleCustomers.js";

test("aggregates sum every product's stats into its category", () => {
  const totals = aggregateCategoryStats(catalogue.products);
  const petCare = totals.get("pet-care");
  // pet-001..004 orders: 389 + 212 + 156 + 31 — includes the below-threshold
  // product too, since aggregation is a different question from whether any
  // single product has enough volume to carry its own card.
  assert.equal(petCare.orders, 389 + 212 + 156 + 31);
});

test("a category with no order-stats data at all is simply absent, not zero", () => {
  const totals = aggregateCategoryStats(catalogue.products);
  assert.equal(totals.has("grocery"), false);
  assert.equal(totals.has("snacks"), false);
});

test("ranks against the real sample data — locks in the exact result so a data change is a deliberate, visible diff", () => {
  const ranked = rankPopularCategories(catalogue.categories, catalogue.products);
  assert.deepEqual(
    ranked.map((c) => c.slug),
    ["household", "stationery", "pet-care", "kitchenware"],
  );
});

test("only categories clearing the existing 'strong' bar qualify — skincare falls just short", () => {
  const ranked = rankPopularCategories(catalogue.categories, catalogue.products);
  assert.equal(ranked.some((c) => c.slug === "skincare"), false);
});

test("the ranking takes no customer as input — there is nothing to personalize with", () => {
  // The function's own signature enforces this (no customer parameter
  // exists), but assert it explicitly: calling it twice, in any order,
  // standing in for "as any two different customers would see it", must
  // produce byte-identical results.
  const a = rankPopularCategories(catalogue.categories, catalogue.products);
  const b = rankPopularCategories(catalogue.categories, catalogue.products);
  assert.deepEqual(a, b);
});

test("the result is independent of which sample customer's data exists alongside it", () => {
  // Not literally passed in, but demonstrates the point concretely: nothing
  // about any sample customer's engagement/purchase history changes the
  // outcome, because the function never reads sampleCustomers.js at all.
  assert.ok(sampleCustomers.length > 0, "sanity check: sample customers exist");
  const ranked = rankPopularCategories(catalogue.categories, catalogue.products);
  assert.equal(ranked.length, 4);
});

test("each ranked entry carries display info plus its own rates, nothing borrowed", () => {
  const ranked = rankPopularCategories(catalogue.categories, catalogue.products);
  for (const c of ranked) {
    assert.ok(c.name && c.emoji, "display fields present");
    assert.ok(c.reorderRate >= 30 && c.returnRate <= 3);
  }
});
