import { NextResponse } from "next/server";

import catalogue from "@/data/products.json";
import { complete } from "@/lib/ai";
import { buildSignal } from "@/lib/orderStats";
import { getProductReviews } from "@/lib/reviews";
import { getCached, setCached } from "@/lib/summaryCache";

export const dynamic = "force-dynamic";

const SYSTEM = `You write one short, honest sentence ABOUT ONE SPECIFIC PRODUCT, named below, for a customer who has never bought from its category before.

You are given order data (how often THIS PRODUCT is reordered, how often it comes back) and, sometimes, real customer reviews that were verified to name this exact product's own brand — not the wider category.

Rules:
- ONE sentence, plain language, at most 30 words. No preamble.
- Name the product, not just the category, somewhere in the sentence — "this serum" or "this dog food," not just "this product."
- The sentence's main claim MUST come from this product's own order numbers — its own reorder rate, its own return rate, its own return reasons. Those numbers exist for every eligible product; review text does not, and most products in this catalogue have none. Numbers carry the sentence; reviews, when present, are colour on top.
- Ground every claim in the numbers or the review text you were given. Invent nothing.
- If no review text is given, say so nothing about it — don't claim reviews exist, don't claim they're silent on some point, just build the sentence entirely from the numbers.
- If the numbers are weak — low reorder rate, high returns — say so plainly. Do not force a positive tone, and never soften a real problem into vague, evasive language ("some feedback varies") that a careful reader can't actually act on.
- Tone for a real problem: state it as one fact among others, not as the sentence's whole verdict — plain and matter-of-fact, not clinical or alarming. Where it's genuinely true, pair the fact with what a buyer can do about it (a patch test, checking the seal, pairing again) instead of leaving the concern to hang with nothing to do about it. This is phrasing, not softening — the fact itself, including naming what the issue actually is (irritation, a defect, a failure), must still be there in full.
- If the numbers look good but the review text raises problems with the PRODUCT, report BOTH. Do not hide the tension.
- Any review text you're given has already been checked to name this exact product's brand — you don't need to hedge it as "other products in the category might say this." It is still one customer's opinion, not a verified fact, so don't state it as settled truth either.
- Never mention price, cost, or value for money, even if the review text discusses it. This card only ever leads with what's working — the numbers and the guarantee. A volunteered price concern right before asking someone to buy raises a doubt the rest of the card doesn't answer, since everything else here is about quality, not cost. Price is answered elsewhere, only if the customer asks.
- Never name or compare against another shop or app.
- Do not quote figures verbatim; they are displayed separately. Describe what they mean.

Separate two different things, because they are not the same:
- PRODUCT quality — does the item itself hold up? Is it what it claimed to be? Does it work, last, fit, taste right?
- DELIVERY and handling — arrived late, crushed in transit, wrong item picked, packaging damaged, missing free gift.

Delivery problems are not product-quality problems. A low rate of transit damage says nothing about whether the product is good, and must not by itself stop a quality claim. Only genuine product faults do — things like the item being defective, hollow, expired, counterfeit, unsealed, causing a reaction, or not being what was described.

Then, on a second line, output exactly one of:
QUALITY_SUPPORTED: yes
QUALITY_SUPPORTED: no

Answer "yes" when the evidence supports a claim that the PRODUCT holds up: people reorder it at a healthy rate, returns are low, and nothing in the review text points to a real product fault.
Answer "no" when the numbers are weak, or when the review text describes genuine product faults that the numbers don't reflect.`;

function buildPrompt({ product, signal, reviews }) {
  const reasons = Object.entries(signal.stats.returnReasons)
    .map(([reason, n]) => `${n} ${reason}`)
    .join(", ");

  const reviewBlock = reviews.length
    ? reviews
        .map((r) => `- (${r.rating ?? "?"}/5) ${r.text}`)
        .join("\n")
    : "(no review verified to be about this specific product — build the sentence from the order numbers alone)";

  return `THE PRODUCT YOUR SENTENCE IS ABOUT: ${product.name} (${product.unit})
Category (for context only, not the subject of the sentence): ${product.category}

${product.name}'s own order data over the last 90 days — this is the evidence your sentence should mainly rest on:
- ${signal.stats.orders} orders
- ${signal.stats.reorders} of those were reorders (${signal.reorderRate}% reorder rate)
- ${signal.stats.returns} returned (${signal.returnRate}% return rate)${reasons ? `, reasons: ${reasons}` : ""}
- overall order signal: ${signal.signal}

Real customer reviews verified to name ${product.name}'s own brand — secondary colour, use sparingly if present at all:
${reviewBlock}`;
}

function parse(raw) {
  const supported = /QUALITY_SUPPORTED:\s*yes/i.test(raw);
  const summary = raw
    .replace(/QUALITY_SUPPORTED:\s*(yes|no)/i, "")
    .trim()
    .replace(/^["']|["']$/g, "");
  return { summary, qualityClaimSupported: supported };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, fresh = false } = body ?? {};
  const product = catalogue.products.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  }

  // Gate first — below the volume threshold we make no AI call at all, and the
  // card does not render.
  const signal = buildSignal(productId);
  if (!signal.eligible) {
    return NextResponse.json({
      eligible: false,
      reason: "not enough order volume to say anything meaningful",
      orders: signal.stats?.orders ?? 0,
    });
  }

  // Scoped to this exact product, not the raw category pool — see
  // lib/reviews.js for why that distinction matters (a dog-food summary must
  // never be grounded in a cat-food complaint from the same category).
  // Capped tighter than the ask box's own review budget on purpose: fewer
  // category reviews in the prompt means less material for the model to lean
  // on for colour, which keeps the product's own numbers doing most of the
  // work in the generated sentence rather than category-wide sentiment.
  const reviews = getProductReviews(product, 5);

  // Regenerate (fresh: true) always bypasses the cache, so that button is
  // guaranteed to be a genuine live call.
  const cacheKey = `summary:${productId}`;
  if (!fresh) {
    const hit = getCached(cacheKey);
    if (hit) return NextResponse.json({ ...hit, cached: true });
  }

  let generated;
  try {
    const raw = await complete({
      system: SYSTEM,
      user: buildPrompt({ product, signal, reviews }),
      maxTokens: 1200,
    });
    generated = parse(raw);
  } catch (error) {
    // Rate limiting is distinct from a real failure: the card should say
    // "busy, retry" rather than vanish, so a demo stays explicable.
    //
    // Don't hard-code the ceiling. The live API reported two different limits
    // for this model on the same key (5 and 20) — there is more than one quota
    // bucket, and the numbers differ by tier. Detect the 429 and say "wait",
    // rather than quoting a figure that will be wrong for someone.
    const isRateLimit = /\b429\b|quota|rate limit/i.test(error.message ?? "");
    if (isRateLimit) {
      return NextResponse.json(
        { eligible: true, rateLimited: true, reason: "AI quota reached" },
        { status: 429 },
      );
    }
    // Any other failure: hide the card rather than render an empty or
    // invented one.
    return NextResponse.json(
      { eligible: false, reason: "generation failed", detail: error.message },
      { status: 502 },
    );
  }

  const payload = {
    eligible: true,
    ...generated,
    qualityLine: generated.qualityClaimSupported
      ? "Reviews and reorders say the quality holds up."
      : null,
    // Raw figures, shown beside the sentence so it can be checked against them.
    stats: {
      orders: signal.stats.orders,
      reorders: signal.stats.reorders,
      returns: signal.stats.returns,
      returnReasons: signal.stats.returnReasons,
      reorderRate: signal.reorderRate,
      returnRate: signal.returnRate,
      signal: signal.signal,
    },
    reviewsUsed: reviews.length,
    // Up to 2 real, brand-verified reviews (see lib/reviews.js) to show
    // directly on the card, not just to feed the generated sentence — a
    // quoted customer, star rating and all, is a stronger trust signal than
    // a paraphrase, and it's honest to show because it already cleared the
    // same brand check the AI prompt did. Positive-only and capped at 2:
    // this card's whole design leads with what's working (see the "never
    // mention price" rule above for the same reasoning applied elsewhere),
    // and most products have zero matching reviews at all — that's the
    // catalogue's real state, not a bug, so this is often empty.
    topReviews: reviews
      .filter((r) => (r.rating ?? 0) >= 4)
      .slice(0, 2)
      .map((r) => ({ text: r.text, rating: r.rating })),
    generatedAt: new Date().toISOString(),
    cached: false,
  };

  setCached(cacheKey, payload);
  return NextResponse.json(payload);
}
