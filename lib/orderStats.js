// Relative, not the "@/" alias: that's a bundler feature, and these functions
// must stay runnable under plain `node --test`.
import { MIN_ORDER_VOLUME, getOrderStats } from "../data/sampleOrderStats.js";

/**
 * Order-signal maths. Plain arithmetic — deliberately not AI.
 *
 * The AI's only job downstream is turning these numbers (plus any review text)
 * into one honest sentence. Everything computed here is checkable by hand, and
 * the card renders the raw figures next to the generated sentence so a viewer
 * can do exactly that.
 */

/** Reorder rate as a percentage of total orders. */
export function reorderRate({ orders, reorders }) {
  if (!orders) return 0;
  return (reorders / orders) * 100;
}

/** Return rate as a percentage of total orders. */
export function returnRate({ orders, returns }) {
  if (!orders) return 0;
  return (returns / orders) * 100;
}

/**
 * Is there enough order volume for the numbers to mean anything?
 *
 * Below the threshold the card does not render at all — a confident-sounding
 * sentence built on 30 orders is exactly the false signal this feature exists
 * to avoid.
 */
export function hasEnoughVolume(stats, min = MIN_ORDER_VOLUME) {
  return Boolean(stats) && stats.orders >= min;
}

/**
 * Classify the signal so the prompt can be honest without the model having to
 * infer thresholds. Returns "strong" | "mixed" | "weak".
 *
 * Cut-offs are judgement calls, stated here rather than buried in a prompt so
 * they can be argued with and tuned.
 */
export function classifySignal(stats) {
  const reorder = reorderRate(stats);
  const returned = returnRate(stats);

  if (reorder >= 30 && returned <= 3) return "strong";
  if (reorder < 20 || returned >= 8) return "weak";
  return "mixed";
}

/** Everything the summary route needs, in one object. */
export function buildSignal(productId) {
  const stats = getOrderStats(productId);
  if (!hasEnoughVolume(stats)) {
    return { eligible: false, stats: stats ?? null };
  }

  return {
    eligible: true,
    stats,
    reorderRate: Number(reorderRate(stats).toFixed(1)),
    returnRate: Number(returnRate(stats).toFixed(1)),
    signal: classifySignal(stats),
  };
}
