import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSignal,
  classifySignal,
  hasEnoughVolume,
  reorderRate,
  returnRate,
} from "./orderStats.js";

test("reorderRate and returnRate are plain percentages", () => {
  assert.equal(reorderRate({ orders: 389, reorders: 142 }).toFixed(1), "36.5");
  assert.equal(returnRate({ orders: 389, returns: 6 }).toFixed(1), "1.5");
});

test("zero orders does not divide by zero", () => {
  assert.equal(reorderRate({ orders: 0, reorders: 0 }), 0);
  assert.equal(returnRate({ orders: 0, returns: 0 }), 0);
});

test("volume gate: below threshold is not enough", () => {
  assert.equal(hasEnoughVolume({ orders: 49 }), false);
  assert.equal(hasEnoughVolume({ orders: 50 }), true, "threshold is inclusive");
  assert.equal(hasEnoughVolume(null), false);
});

test("classifySignal: strong reorder with few returns is strong", () => {
  assert.equal(
    classifySignal({ orders: 389, reorders: 142, returns: 6 }),
    "strong",
  );
});

test("classifySignal: low reorder OR high returns is weak", () => {
  assert.equal(
    classifySignal({ orders: 274, reorders: 38, returns: 31 }),
    "weak",
    "low reorder and high returns",
  );
  assert.equal(
    classifySignal({ orders: 100, reorders: 40, returns: 9 }),
    "weak",
    "good reorder is not enough if returns are high",
  );
});

test("classifySignal: middling numbers are mixed, not forced positive", () => {
  assert.equal(
    classifySignal({ orders: 198, reorders: 54, returns: 11 }),
    "mixed",
  );
});

test("buildSignal returns ineligible for thin volume, with no rates", () => {
  const result = buildSignal("pet-004"); // 31 orders in sample data
  assert.equal(result.eligible, false);
  assert.equal(result.reorderRate, undefined);
});

test("buildSignal returns ineligible for an unknown product", () => {
  assert.equal(buildSignal("does-not-exist").eligible, false);
});

test("buildSignal exposes rates and signal for a real product", () => {
  const result = buildSignal("pet-001");
  assert.equal(result.eligible, true);
  assert.equal(result.reorderRate, 36.5);
  assert.equal(result.returnRate, 1.5);
  assert.equal(result.signal, "strong");
  assert.equal(result.stats.orders, 389);
});

test("the four demo outcomes are actually distinct", () => {
  assert.equal(buildSignal("pet-001").signal, "strong"); // vs critical reviews
  assert.equal(buildSignal("skn-002").signal, "strong"); // vs positive reviews
  assert.equal(buildSignal("skn-001").signal, "weak"); // honest negative
  assert.equal(buildSignal("pet-004").eligible, false); // no card
});
