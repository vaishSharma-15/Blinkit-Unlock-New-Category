import test from "node:test";
import assert from "node:assert/strict";

import { getEligible, isMAC, rankEligible } from "./eligibility.js";
import { sampleCustomers } from "../data/sampleCustomers.js";

const byId = (id) => sampleCustomers.find((c) => c.id === id);
const slugs = (list) => list.map((e) => e.category);

test("isMAC: recent order qualifies, lapsed does not", () => {
  assert.equal(isMAC({ lastOrderDaysAgo: 0 }), true);
  assert.equal(isMAC({ lastOrderDaysAgo: 30 }), true, "boundary is inclusive");
  assert.equal(isMAC({ lastOrderDaysAgo: 31 }), false);
  assert.equal(isMAC({ lastOrderDaysAgo: undefined }), false);
  assert.equal(isMAC({}), false);
  assert.equal(isMAC(null), false);
});

test("c1 single-signal customer: one eligible category", () => {
  const eligible = getEligible(byId("c1"));
  assert.deepEqual(slugs(eligible), ["pet-care"]);
});

test("c2 multi-signal customer: ALL categories, not one", () => {
  // The spec's central multi-category case. Reducing this to a single winner
  // is the failure mode the engine exists to prevent.
  const eligible = getEligible(byId("c2"));
  assert.equal(eligible.length, 3);
  assert.deepEqual(
    new Set(slugs(eligible)),
    new Set(["pet-care", "electronics", "stationery"]),
  );
});

test("c3 no-signal customer: empty, with no fallback", () => {
  const eligible = getEligible(byId("c3"));
  assert.deepEqual(eligible, [], "no signal must mean no suggestions at all");
});

test("c4 lapsed customer: empty despite a strong signal", () => {
  const customer = byId("c4");
  assert.equal(isMAC(customer), false);
  assert.deepEqual(getEligible(customer), []);
});

test("c5: stale-but-genuine skincare interest still counts, already-purchased stationery does not", () => {
  // skincare is 150 days old — old, but real, never-bought interest, so it
  // stays eligible and is marked stale rather than dropped. Stationery is
  // excluded because she already bought it, not because of its recency.
  const eligible = getEligible(byId("c5"));
  assert.deepEqual(slugs(eligible), ["skincare"]);
  assert.equal(eligible[0].stale, true);
});

test("engagement inside the lookback window is not marked stale", () => {
  const eligible = getEligible({
    lastOrderDaysAgo: 1,
    engaged: [{ category: "pet-care", daysAgo: 10, type: "search" }],
    purchased: [],
  });
  assert.equal(eligible[0].stale, false);
});

test("engagement beyond the stale lookback window is dropped entirely", () => {
  const eligible = getEligible({
    lastOrderDaysAgo: 1,
    engaged: [{ category: "pet-care", daysAgo: 400, type: "search" }],
    purchased: [],
  });
  assert.deepEqual(eligible, []);
});

test("purchased categories are excluded even when recently engaged", () => {
  const eligible = getEligible({
    lastOrderDaysAgo: 1,
    engaged: [{ category: "skincare", daysAgo: 1, type: "search" }],
    purchased: ["skincare"],
  });
  assert.deepEqual(eligible, [], "already bought means it isn't a new category");
});

test("categories with no products are filtered out", () => {
  const customer = {
    lastOrderDaysAgo: 1,
    engaged: [
      { category: "pet-care", daysAgo: 1, type: "search" },
      { category: "gardening", daysAgo: 1, type: "search" },
    ],
    purchased: [],
  };
  const eligible = getEligible(customer, {
    availableCategories: ["pet-care", "skincare"],
  });
  assert.deepEqual(slugs(eligible), ["pet-care"]);
});

test("repeated engagement collapses to the most recent touch", () => {
  const eligible = getEligible({
    lastOrderDaysAgo: 1,
    engaged: [
      { category: "pet-care", daysAgo: 10, type: "browse" },
      { category: "pet-care", daysAgo: 2, type: "search" },
    ],
    purchased: [],
  });
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].daysAgo, 2);
});

test("malformed engagement entries are ignored, not crashed on", () => {
  const eligible = getEligible({
    lastOrderDaysAgo: 1,
    engaged: [
      null,
      { category: null, daysAgo: 1 },
      { category: "pet-care", daysAgo: -1 },
      { category: "skincare" },
      { category: "pet-care", daysAgo: 3, type: "search" },
    ],
    purchased: [],
  });
  assert.deepEqual(slugs(eligible), ["pet-care"]);
});

test("getEligible orders most recent first", () => {
  const eligible = getEligible({
    lastOrderDaysAgo: 1,
    engaged: [
      { category: "skincare", daysAgo: 9, type: "browse" },
      { category: "pet-care", daysAgo: 2, type: "search" },
    ],
    purchased: [],
  });
  assert.deepEqual(slugs(eligible), ["pet-care", "skincare"]);
});

test("rankEligible: recency wins over complaint volume", () => {
  const ranked = rankEligible(
    [
      { category: "skincare", daysAgo: 1 },
      { category: "pet-care", daysAgo: 5 },
    ],
    { complaintVolume: { skincare: 99, "pet-care": 0 } },
  );
  assert.deepEqual(slugs(ranked), ["skincare", "pet-care"]);
});

test("rankEligible: complaint volume breaks a recency tie", () => {
  const ranked = rankEligible(
    [
      { category: "pet-care", daysAgo: 1 },
      { category: "skincare", daysAgo: 1 },
    ],
    { complaintVolume: { "pet-care": 40, skincare: 5 } },
  );
  assert.deepEqual(
    slugs(ranked),
    ["skincare", "pet-care"],
    "trust is easier to earn where there are fewer quality complaints",
  );
});

test("rankEligible: fully tied input is stable, not random", () => {
  const input = [
    { category: "skincare", daysAgo: 1 },
    { category: "pet-care", daysAgo: 1 },
  ];
  assert.deepEqual(slugs(rankEligible(input)), slugs(rankEligible(input)));
});

test("rankEligible does not mutate its input", () => {
  const input = [
    { category: "skincare", daysAgo: 9 },
    { category: "pet-care", daysAgo: 1 },
  ];
  const before = slugs(input);
  rankEligible(input);
  assert.deepEqual(slugs(input), before);
});

test("no customer's data can leak into another's result", () => {
  // Every sample customer's eligibility must be derivable from that customer
  // alone — the engine takes one object and has no access to the rest.
  for (const customer of sampleCustomers) {
    const isolated = getEligible(structuredClone(customer));
    const inContext = getEligible(customer);
    assert.deepEqual(slugs(isolated), slugs(inContext));
  }
});
