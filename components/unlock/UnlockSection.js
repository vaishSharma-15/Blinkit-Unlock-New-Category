"use client";

import { useState } from "react";

import { readCookie, writeCookie } from "@/lib/clientCookie";
import { PURCHASED_COOKIE, addScoped } from "@/lib/demoSession";
import PostPurchase from "./PostPurchase";
import StillCuriousRow from "./StillCuriousRow";
import UnlockCard from "./UnlockCard";

/**
 * Everything the Unlock feature owns on a category page, in one place: the
 * card, the still-curious row under it, and what replaces that row once the
 * customer buys.
 *
 * This component exists because those pieces share two pieces of state that
 * neither the server nor the card alone can hold:
 *
 * - whether the card actually rendered a full summary. If the AI call failed
 *   outright, the card hides itself entirely. If the product is below the
 *   volume gate, the card still renders — honestly, as "not enough data yet"
 *   rather than a generated sentence — but neither case counts as "visible"
 *   for the still-curious row below, which only belongs beside a real,
 *   AI-backed claim.
 * - whether the customer has bought. Purchase is recorded to a cookie so the
 *   rest of the app sees the category as bought (the eligibility engine then
 *   retires that nudge by itself), but this page is deliberately *not*
 *   refreshed — you should be able to see what you just bought.
 */
export default function UnlockSection({
  product,
  category,
  customerId,
  remaining,
}) {
  const [status, setStatus] = useState("loading");
  // "browsing" -> "cart" -> "purchased". Two real steps, matching how the
  // real app separates adding an item from committing to the order — a
  // single "Buy now" button that immediately completes a purchase was never
  // how the actual checkout works.
  const [stage, setStage] = useState("browsing");

  function placeOrder() {
    writeCookie(
      PURCHASED_COOKIE,
      addScoped(readCookie(PURCHASED_COOKIE), customerId, category.slug),
    );
    setStage("purchased");
  }

  const visible = status === "done";
  const purchased = stage === "purchased";

  return (
    <>
      <UnlockCard
        product={product}
        onStatusChange={setStatus}
        footer={
          purchased ? null : (
            <CartFlow
              product={product}
              stage={stage}
              onAddToCart={() => setStage("cart")}
              onPlaceOrder={placeOrder}
            />
          )
        }
      />

      {visible && purchased && (
        <PostPurchase
          customerId={customerId}
          category={category}
          remaining={remaining}
        />
      )}

      {/* Before the purchase this is the second eligible category; after it,
          PostPurchase carries the forward-looking prompt instead, so showing
          both would ask the same question twice. */}
      {visible && !purchased && <StillCuriousRow categories={remaining} />}
    </>
  );
}

/**
 * The two-step purchase flow: Add to Cart, then a distinct cart-review state
 * with its own Place Order action. "Order placed" only ever follows a
 * genuine second tap — never the same tap that added the item.
 */
function CartFlow({ product, stage, onAddToCart, onPlaceOrder }) {
  if (stage === "cart") {
    return (
      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-[#f7f7f8] px-3 py-2.5">
          <CartIcon />
          <span className="min-w-0 flex-1 text-[12px]">
            <span className="block font-semibold">1 item in cart</span>
            <span className="block text-muted">{product.name}</span>
          </span>
          <span className="shrink-0 text-[13px] font-bold">
            ₹{product.price}
          </span>
        </div>
        <button
          type="button"
          onClick={onPlaceOrder}
          className="mt-2 w-full rounded-lg bg-blinkit-green px-3 py-2.5 text-[13px] font-bold text-white"
        >
          Place order
        </button>
        <p className="mt-1 text-center text-[10px] text-muted">
          Demo — places the order instantly, no payment step.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={onAddToCart}
        className="w-full rounded-lg border border-blinkit-green bg-blinkit-green/5 px-3 py-2.5 text-[13px] font-bold text-blinkit-green"
      >
        Add to cart · ₹{product.price}
      </button>
    </div>
  );
}

function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-blinkit-green"
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}
