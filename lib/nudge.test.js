import test from "node:test";
import assert from "node:assert/strict";

import { buildNudges, nudgeText, shortNudgeText } from "./nudge.js";
import { getEligible, rankEligible } from "./eligibility.js";
import { sampleCustomers } from "../data/sampleCustomers.js";

const byId = (id) => sampleCustomers.find((c) => c.id === id);
const CATEGORIES = [
  { slug: "pet-care", name: "Pet Care" },
  { slug: "electronics", name: "Electronics" },
  { slug: "stationery", name: "Stationery" },
];

test("a search and a browse are worded differently", () => {
  assert.match(
    nudgeText({ category: "pet-care", type: "search" }, "Pet Care"),
    /continue your last search/i,
  );
  assert.match(
    nudgeText({ category: "skincare", type: "browse" }, "Skincare"),
    /still thinking about/i,
  );
});

test("an unknown category falls back to its display name", () => {
  assert.match(
    nudgeText({ category: "gardening", type: "search" }, "Gardening"),
    /gardening/,
  );
  assert.equal(shortNudgeText({ category: "gardening" }, "Gardening"), "Gardening");
});

test("the short label is chip-sized: at most three words", () => {
  // It sits beside a search field on a phone. A sentence would crowd out the
  // field itself, which is the thing the bar is actually for.
  for (const slug of ["pet-care", "skincare", "stationery", "household"]) {
    const short = shortNudgeText({ category: slug }, slug);
    assert.ok(
      short.split(/\s+/).length <= 3,
      `"${short}" is too long for the chip`,
    );
    assert.match(short, /^[A-Z]/, "reads as a label, so it starts capitalised");
  }
});

test("the full sentence survives as the accessible label", () => {
  // The chip abbreviates visually; a screen reader should still get the whole
  // thought, not two words with no verb.
  const [nudge] = buildNudges(rankEligible(getEligible(byId("c1"))), CATEGORIES);
  assert.equal(nudge.short, "Dog food");
  assert.match(nudge.label, /continue your last search — dog food\?/);
});

test("c2 multi-signal: every eligible category gets a chip, in ranked order", () => {
  const eligible = rankEligible(getEligible(byId("c2")));
  const nudges = buildNudges(eligible, CATEGORIES);

  assert.equal(nudges.length, 3, "no eligible category is dropped");
  // pet-care and electronics are tied same-day signals; rankEligible breaks
  // the tie alphabetically, so "electronics" sorts first.
  assert.deepEqual(
    nudges.map((n) => n.href),
    ["/category/electronics", "/category/pet-care", "/category/stationery"],
    "each chip routes to its own category page",
  );
  assert.deepEqual(
    nudges.map((n) => n.short),
    ["Earbuds", "Dog food", "Notebooks"],
  );
});

test("c1 single-signal: exactly one chip", () => {
  const nudges = buildNudges(rankEligible(getEligible(byId("c1"))), CATEGORIES);
  assert.equal(nudges.length, 1);
});

test("c3 no signal: no chip at all, and no generic stand-in", () => {
  // The chip appearing is itself the claim that we have a reason. With no
  // signal there is no reason, so there is no chip.
  assert.deepEqual(buildNudges(getEligible(byId("c3")), CATEGORIES), []);
});

test("c4 lapsed: no chip despite a strong signal", () => {
  assert.deepEqual(buildNudges(getEligible(byId("c4")), CATEGORIES), []);
});

test("c5: the stale skincare interest still gets a chip, honestly worded as old", () => {
  const nudges = buildNudges(rankEligible(getEligible(byId("c5"))), CATEGORIES);
  assert.equal(nudges.length, 1);
  assert.equal(nudges[0].category, "skincare");
  assert.match(nudges[0].label, /a while back/i);
  assert.doesNotMatch(nudges[0].label, /continue your last search|still thinking about/i);
});

test("a stale entry never claims to be a recent search or recent browse", () => {
  assert.match(
    nudgeText({ category: "skincare", type: "search", stale: true }, "Skincare"),
    /a while back/i,
  );
  assert.match(
    nudgeText({ category: "skincare", type: "browse", stale: true }, "Skincare"),
    /a while back/i,
  );
});

test("every chip carries a route — a nudge with no destination is a dead end", () => {
  const nudges = buildNudges(rankEligible(getEligible(byId("c2"))), CATEGORIES);
  for (const n of nudges) {
    assert.match(n.href, /^\/category\/[a-z-]+$/);
    assert.ok(n.short.length > 0 && n.label.length > 0);
  }
});
