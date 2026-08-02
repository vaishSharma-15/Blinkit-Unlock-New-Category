"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { ProductPhotoFallback } from "@/components/shell/CategoryIcon";
import AskBox from "./AskBox";

/** Fixed text — never AI, never names another shop. */
const DELIVERY_LINE = "Get it at your door in 10 minutes.";
const GUARANTEE_LINE =
  "First time in this category? Free return within 24 hours, no questions asked.";

/**
 * The Unlock New Category card.
 *
 * Renders nothing at all when the API says the product is ineligible — too
 * little order volume, or generation failed. A hidden card is the correct
 * outcome; an empty or invented one is not.
 *
 * `onStatusChange` reports that outcome upward, because anything rendered
 * below the card (Phase 7's still-curious row) must disappear with it.
 * `footer` is a slot at the end of the card, shown only once there is a real
 * summary to attach it to.
 */
export default function UnlockCard({ product, onStatusChange, footer }) {
  const [state, setState] = useState({ status: "loading" });

  const report = useCallback(
    (status) => onStatusChange?.(status),
    [onStatusChange],
  );

  const load = useCallback(
    async (fresh) => {
      // Only the Regenerate path sets state here. The initial load starts from
      // the "loading" initial state, so the effect below never calls setState
      // synchronously (which would trigger cascading renders).
      if (fresh) setState((s) => ({ ...s, status: "regenerating" }));
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ productId: product.id, fresh }),
        });
        const data = await res.json();
        if (data.rateLimited) {
          // Explicable, not silent — the free tier throttles hard.
          setState({ status: "ratelimited" });
          report("ratelimited");
          return;
        }
        if (!res.ok || !data.eligible) {
          // Distinct from a real failure: too little order volume to say
          // anything meaningful is itself an honest thing to tell the
          // customer, not a reason to disappear. A genuine generation
          // failure still hides — see the "hidden" branch below — because
          // there we have nothing true to say at all, whereas here we do:
          // "we don't have enough data yet."
          if (data.reason?.startsWith("not enough order volume")) {
            setState({ status: "thin", orders: data.orders ?? 0 });
            report("thin");
            return;
          }
          setState({ status: "hidden" });
          report("hidden");
          return;
        }
        setState({ status: "done", ...data });
        report("done");
      } catch {
        setState({ status: "hidden" });
        report("hidden");
      }
    },
    [product.id, report],
  );

  // Fetch-on-mount: the summary must be generated live per view, so it can't
  // come from the server component. The lint rule flags the setState calls
  // that happen after the await inside `load`; those are asynchronous
  // completions, not the cascading-render pattern the rule targets.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(false);
  }, [load]);

  if (state.status === "hidden") return null;

  if (state.status === "thin") {
    return (
      <section className="mx-3 mt-3 overflow-hidden rounded-2xl border border-border bg-white p-3.5 shadow-sm">
        <div className="mb-2.5 flex items-center gap-2.5">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#f7f7f8]">
            {product.image ? (
              <Image
                src={product.image}
                alt=""
                fill
                sizes="44px"
                className="object-contain p-1"
              />
            ) : (
              <ProductPhotoFallback category={product.category} size={20} />
            )}
          </div>
          <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
            {product.name}
          </p>
        </div>
        <p className="text-[12px] text-muted">
          Still building out order data for this category — only {state.orders}{" "}
          orders so far, not enough to summarise honestly yet.
        </p>
        <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] font-medium">
          <BoltIcon />
          {DELIVERY_LINE}
        </p>
        <p className="mt-2 flex items-center gap-2 rounded-xl bg-blinkit-green/8 px-3 py-2 text-[11px] font-medium text-blinkit-green">
          <ShieldIcon />
          {GUARANTEE_LINE}
        </p>
        <AskBox productId={product.id} />
        {footer}
      </section>
    );
  }

  if (state.status === "ratelimited") {
    return (
      <section className="mx-3 mt-3 overflow-hidden rounded-2xl border border-[#f0dfa0] bg-[#fffbe6] p-3.5 shadow-sm">
        <p className="text-[12px] text-[#7a6414]">
          AI quota reached — the free tier allows only a few generations a
          minute. Give it a moment and try again.
        </p>
        <button
          type="button"
          onClick={() => load(true)}
          className="mt-2.5 rounded-lg border border-[#c9a227] bg-white px-3 py-1.5 text-[11px] font-bold text-[#7a6414]"
        >
          Try again
        </button>
      </section>
    );
  }

  const loading = state.status === "loading";
  const regenerating = state.status === "regenerating";

  return (
    <section className="mx-3 mt-3 overflow-hidden rounded-2xl border border-blinkit-green/20 bg-white shadow-[0_2px_16px_rgba(12,131,31,0.08)]">
      {/* Deep-green header band — the card's "this is a confident claim"
          signal, matched to the same weight of colour the rest of the app
          uses for its own campaign banners (see PromoGrid's dark strip). */}
      <div className="flex items-center justify-between gap-2 bg-blinkit-green px-3.5 py-2.5">
        <h2 className="flex items-center gap-1.5 text-[12.5px] font-bold text-white">
          <Sparkle />
          Unlock New Category
        </h2>
        {state.status === "done" && (
          <button
            type="button"
            onClick={() => load(true)}
            disabled={regenerating}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-50"
          >
            <RegenerateIcon spinning={regenerating} />
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
        )}
      </div>

      <div className="p-3.5">
        {/* Product identity: a real thumbnail where one exists, so the claim
            below is anchored to something the eye can check against — the
            same instinct behind showing raw stats next to the AI sentence. */}
        <div className="mb-2.5 flex items-center gap-2.5">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#f7f7f8]">
            {product.image ? (
              <Image
                src={product.image}
                alt=""
                fill
                sizes="44px"
                className="object-contain p-1"
              />
            ) : (
              <ProductPhotoFallback category={product.category} size={20} />
            )}
          </div>
          <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
            {product.name}
          </p>
        </div>

        {loading ? (
          <SkeletonLine label="Analysing order history and customer reviews…" />
        ) : (
          <>
            <p
              className={`text-[13.5px] leading-relaxed transition-opacity ${
                regenerating ? "opacity-40" : "opacity-100"
              }`}
            >
              {state.summary}
            </p>
            {regenerating && (
              <p className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                <Spinner />
                Generating a fresh summary…
              </p>
            )}
          </>
        )}

        {state.status === "done" && (
          <>
            {/* Raw figures, so the sentence above can be checked against them. */}
            <dl className="mt-2.5 flex flex-wrap gap-1.5 text-[10px]">
              <Stat label="orders" value={state.stats.orders} />
              <Stat
                label="reorders"
                value={`${state.stats.reorders} (${state.stats.reorderRate}%)`}
                good
              />
              <Stat
                label="returns"
                value={`${state.stats.returns} (${state.stats.returnRate}%)`}
              />
              {Object.entries(state.stats.returnReasons).map(([reason, n]) => (
                <Stat key={reason} label={reason} value={n} muted />
              ))}
            </dl>
            <p className="mt-1.5 text-[9px] text-muted">
              Order figures are illustrative sample data · summary generated
              live at {new Date(state.generatedAt).toLocaleTimeString()}
              {state.cached ? " (cached, hit Regenerate for a fresh call)" : ""}
            </p>

            {/* Real customer quotes, not paraphrased — only ever the ones
                already verified to name this exact product's own brand (see
                lib/reviews.js). Most products in this catalogue have none;
                this section simply doesn't render for those, same as every
                other honest-degrade in this app. */}
            {state.topReviews?.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {state.topReviews.map((review, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-[#f7f7f8] px-2.5 py-2 text-[11.5px] leading-snug"
                  >
                    <Stars rating={review.rating} />
                    <p className="mt-0.5 text-foreground">&ldquo;{review.text}&rdquo;</p>
                  </li>
                ))}
              </ul>
            )}

            {/* Quality half is AI and conditional; delivery half is fixed text. */}
            <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] font-medium">
              <BoltIcon />
              <span>
                {state.qualityLine ? `${state.qualityLine} ` : ""}
                {DELIVERY_LINE}
              </span>
            </p>

            <p className="mt-2 flex items-center gap-2 rounded-xl bg-blinkit-green/8 px-3 py-2 text-[11px] font-medium text-blinkit-green">
              <ShieldIcon />
              {GUARANTEE_LINE}
            </p>

            <AskBox productId={product.id} />

            {footer}
          </>
        )}
      </div>
    </section>
  );
}

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill={i < rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={i < rating ? "text-blinkit-green" : "text-border"}
        >
          <path d="M12 2l2.9 6.3 6.8.8-5 4.8 1.3 6.8L12 17.4 5.9 20.7l1.3-6.8-5-4.8 6.8-.8z" />
        </svg>
      ))}
    </span>
  );
}

function Stat({ label, value, muted, good }) {
  return (
    <div
      className={`rounded-lg px-2 py-1 ${
        good
          ? "bg-blinkit-green/10 text-blinkit-green"
          : muted
            ? "bg-[#f7f7f8] text-muted"
            : "bg-[#f7f7f8] text-foreground"
      }`}
    >
      <dt className="inline opacity-70">{label}: </dt>
      <dd className="inline font-bold">{value}</dd>
    </div>
  );
}

function SkeletonLine({ label }) {
  return (
    <div>
      <div className="h-3 w-full animate-pulse rounded bg-black/10" />
      <div className="mt-1.5 h-3 w-3/5 animate-pulse rounded bg-black/10" />
      <p className="mt-2 flex items-center gap-2 text-[11px] text-muted">
        <Spinner />
        {label}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent"
      aria-hidden="true"
    />
  );
}

function Sparkle() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </svg>
  );
}

function RegenerateIcon({ spinning }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={spinning ? "animate-spin" : ""}
    >
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16M3 21v-5h5" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-blinkit-green"
    >
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
