// Relative, not the "@/" alias: that's a bundler feature, and these functions
// must stay runnable under plain `node --test`.
import { sampleOrderStats } from "../data/sampleOrderStats.js";
import { classifySignal, reorderRate, returnRate } from "./orderStats.js";

/**
 * "New to Explore" — the fixed, non-personalized entry point for a Monthly
 * Active Customer with no search or browse signal of their own.
 *
 * The whole feature otherwise runs on one customer's own engagement, and this
 * is the deliberate exception: a MAC who only ever touches groceries still
 * counts toward the company's exploration goal, and has no personal signal to
 * build a nudge from. Rather than fabricate one, this shows a fixed shelf —
 * whichever categories genuinely earn it in aggregate, across every customer,
 * not this one.
 *
 * Three rules keep that honest, mirroring the ones already enforced
 * elsewhere in this codebase:
 *   - computed from real aggregate order data, not invented
 *   - identical for every zero-signal customer — never personalized, never
 *     inferred from this customer, never a similar-customers comparison
 *   - plain arithmetic, not AI — same "not AI" boundary as the eligibility
 *     engine and the order-stats maths it's built from
 */

/**
 * Aggregate order stats for a category: every product in it, summed.
 * Categories with no product data (grocery, snacks, in the current sample
 * set) are absent from the result rather than reported as zero — there is
 * nothing to aggregate, which is different from aggregating to nothing.
 */
export function aggregateCategoryStats(products) {
  const totals = new Map();

  for (const product of products) {
    const stats = sampleOrderStats[product.id];
    if (!stats) continue;

    const running = totals.get(product.category) ?? {
      orders: 0,
      reorders: 0,
      returns: 0,
    };
    running.orders += stats.orders;
    running.reorders += stats.reorders;
    running.returns += stats.returns;
    totals.set(product.category, running);
  }

  return totals;
}

/**
 * Which categories qualify for the fixed shelf, ranked strongest first.
 *
 * Reuses lib/orderStats.js's existing "strong" threshold (reorder ≥30%,
 * return ≤3%) rather than inventing a new cut-off just for this — the same
 * bar a single product must clear to support an unqualified quality claim
 * applies here too, aggregated up to the category.
 *
 * @param {Array} categories Catalogue categories (needs slug, name, emoji).
 * @param {Array} products Catalogue products (needs id, category).
 * @returns {Array<{slug, name, emoji, reorderRate, returnRate}>}
 */
export function rankPopularCategories(categories, products) {
  const totals = aggregateCategoryStats(products);
  const nameOf = new Map(categories.map((c) => [c.slug, c]));

  const ranked = [];
  for (const [slug, stats] of totals) {
    if (classifySignal(stats) !== "strong") continue;
    const category = nameOf.get(slug);
    if (!category) continue;
    ranked.push({
      ...category,
      reorderRate: Number(reorderRate(stats).toFixed(1)),
      returnRate: Number(returnRate(stats).toFixed(1)),
    });
  }

  // Strongest reorder rate first. A tie-break on return rate keeps the order
  // stable rather than arbitrary — ties are otherwise possible with a small
  // catalogue like this one.
  return ranked.sort(
    (a, b) => b.reorderRate - a.reorderRate || a.returnRate - b.returnRate,
  );
}
