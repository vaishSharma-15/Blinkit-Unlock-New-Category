import test from "node:test";
import assert from "node:assert/strict";

import { applyDemoSession } from "./demoSession.js";
import { getEligible, isMAC } from "./eligibility.js";
import { sampleCustomers } from "../data/sampleCustomers.js";

const byId = (id) => sampleCustomers.find((c) => c.id === id);

test("Meera: a MAC with zero prior signal becomes eligible the moment she searches live", () => {
  const meera = byId("c3");
  assert.equal(isMAC(meera), true, "she is a MAC");
  assert.deepEqual(getEligible(meera), [], "no prior signal means no nudge, today");

  // She types "dog" right now. lib/searchSignal.matchCategory resolves that to
  // pet-care client-side; the cookie write is what this line stands in for.
  const afterSearch = applyDemoSession(meera, { searched: ["pet-care"] });
  const eligible = getEligible(afterSearch);

  assert.equal(eligible.length, 1, "the live search alone is enough");
  assert.equal(eligible[0].category, "pet-care");
  assert.equal(eligible[0].daysAgo, 0, "it's happening right now, not backdated");
});

test("a live search for a category already purchased does not become eligible", () => {
  // c1 has already bought grocery and snacks. Searching for milk live should
  // not create a fake new-category signal for something she already buys.
  const priya = byId("c1");
  const afterSearch = applyDemoSession(priya, { searched: ["grocery"] });
  assert.deepEqual(
    getEligible(afterSearch).map((e) => e.category),
    ["pet-care"],
    "grocery stays excluded — searched or not, she already buys it",
  );
});

test("a live search cannot make a lapsed (non-MAC) customer eligible", () => {
  // Rohan (c4) is not a MAC. The nudge must never show for him, however
  // deliberate the live search looks.
  const rohan = byId("c4");
  const afterSearch = applyDemoSession(rohan, { searched: ["skincare"] });
  assert.deepEqual(getEligible(afterSearch), []);
});

test("a live search for one category doesn't disturb another customer's data", () => {
  const meera = byId("c3");
  const untouched = getEligible(meera);
  applyDemoSession(meera, { searched: ["stationery"] });
  assert.deepEqual(
    getEligible(meera),
    untouched,
    "applyDemoSession must not mutate the sample customer object",
  );
});
