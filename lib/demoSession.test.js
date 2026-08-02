import test from "node:test";
import assert from "node:assert/strict";

import { addScoped, applyDemoSession, scopedList } from "./demoSession.js";
import { getEligible, rankEligible } from "./eligibility.js";
import { sampleCustomers } from "../data/sampleCustomers.js";

const byId = (id) => sampleCustomers.find((c) => c.id === id);
const slugs = (list) => list.map((e) => e.category);

test("scopedList only returns the named customer's entries", () => {
  const raw = "c1:pet-care,c2:skincare,c2:stationery";
  assert.deepEqual(scopedList(raw, "c2"), ["skincare", "stationery"]);
  assert.deepEqual(scopedList(raw, "c1"), ["pet-care"]);
  assert.deepEqual(scopedList(raw, "c3"), []);
});

test("scopedList survives empty and malformed cookie values", () => {
  assert.deepEqual(scopedList(undefined, "c2"), []);
  assert.deepEqual(scopedList("", "c2"), []);
  assert.deepEqual(scopedList(",, ,", "c2"), []);
});

test("addScoped appends once and is idempotent", () => {
  const once = addScoped("", "c2", "pet-care");
  assert.equal(once, "c2:pet-care");
  assert.equal(addScoped(once, "c2", "pet-care"), once, "no duplicate entries");
  assert.equal(addScoped(once, "c2", "skincare"), "c2:pet-care,c2:skincare");
});

test("a purchase by one customer never appears for another", () => {
  const raw = addScoped("", "c1", "pet-care");
  assert.deepEqual(scopedList(raw, "c2"), []);
});

test("applyDemoSession merges purchases without losing sample history", () => {
  const merged = applyDemoSession(byId("c2"), { purchased: ["pet-care"] });
  assert.deepEqual(new Set(merged.purchased), new Set(["grocery", "pet-care"]));
  assert.deepEqual(merged.boughtInDemo, ["pet-care"]);
  assert.deepEqual(
    byId("c2").purchased,
    ["grocery"],
    "the sample data itself must not be mutated",
  );
});

test("Phase 7 loop: buying pet care leaves electronics next for c2", () => {
  // The spec's acceptance case: pet care → purchase → prompted toward electronics.
  const before = rankEligible(getEligible(byId("c2")));
  // pet-care and electronics are both same-day signals (tied on daysAgo);
  // rankEligible breaks that tie alphabetically, and "electronics" sorts
  // before "pet-care".
  assert.deepEqual(slugs(before), ["electronics", "pet-care", "stationery"]);

  const after = rankEligible(
    getEligible(applyDemoSession(byId("c2"), { purchased: ["pet-care"] })),
  );
  assert.deepEqual(
    slugs(after),
    ["electronics", "stationery"],
    "the bought category retires itself; the rest stay in order",
  );
  assert.equal(after[0].category, "electronics", "the forward prompt has a target");
});

test("buying the last eligible category leaves nothing to suggest", () => {
  // c1 has exactly one signal. After buying it there is no next category, and
  // the post-purchase panel must show the button alone rather than invent one.
  const after = getEligible(
    applyDemoSession(byId("c1"), { purchased: ["pet-care"] }),
  );
  assert.deepEqual(after, []);
});

test("a demo purchase cannot create eligibility for a no-signal customer", () => {
  const after = getEligible(
    applyDemoSession(byId("c3"), { purchased: ["pet-care"], frequent: ["pet-care"] }),
  );
  assert.deepEqual(after, [], "buying is subtractive only, never a new signal");
});
