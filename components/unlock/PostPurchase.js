"use client";

import Link from "next/link";
import { useState } from "react";

import CategoryIcon from "@/components/shell/CategoryIcon";
import { readCookie, writeCookie } from "@/lib/clientCookie";
import { FREQUENT_COOKIE, addScoped } from "@/lib/demoSession";

/**
 * What renders after a purchase made through the Unlock card.
 *
 * The two halves are deliberately paired, and deliberately different in kind:
 *
 * 1. "Add to your frequent categories" — the customer decides. Nothing gets
 *    added to their home screen because an algorithm inferred one order meant
 *    a new habit. One purchase is not a habit; the button is how they say it is.
 * 2. A forward-looking prompt drawn from what's *left* of their own eligible
 *    categories. When nothing is left, the button stands alone with a plain
 *    confirmation — never a generated or generic category to fill the space.
 */
export default function PostPurchase({ customerId, category, remaining }) {
  const [added, setAdded] = useState(false);
  const next = remaining?.[0] ?? null;

  function addToFrequent() {
    writeCookie(
      FREQUENT_COOKIE,
      addScoped(readCookie(FREQUENT_COOKIE), customerId, category.slug),
    );
    setAdded(true);
  }

  return (
    <section className="mx-3 mt-2 rounded-xl border border-blinkit-green/30 bg-white p-3">
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-blinkit-green">
        <TickIcon />
        Order placed — your first {category.name} order
      </p>

      {added ? (
        <p className="mt-2 rounded-lg bg-blinkit-green/5 px-2.5 py-2 text-[12px] text-blinkit-green">
          {category.name} is now one of your categories. You&apos;ll see it
          first on the home screen.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={addToFrequent}
            className="mt-2 w-full rounded-lg bg-blinkit-green px-3 py-2.5 text-[13px] font-bold text-white"
          >
            + Add {category.name} to your frequent categories
          </button>
          <p className="mt-1 text-[10px] text-muted">
            Only if you want it. We won&apos;t add it for you.
          </p>
        </>
      )}

      {next ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-[12px]">
            Since you&apos;re on a roll, want to check out{" "}
            <strong>{next.name}</strong> too?
          </p>
          <p className="mt-0.5 text-[10px] text-muted">
            You looked at it {next.daysAgo === 1 ? "yesterday" : `${next.daysAgo} days ago`} and never bought from it.
          </p>
          <Link
            href={`/category/${next.slug}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blinkit-green px-3 py-2 text-[12px] font-bold text-blinkit-green"
          >
            <CategoryIcon slug={next.slug} size={16} />
            Take a look at {next.name}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        // Nothing left that this customer showed interest in. That is a
        // finished loop, not an empty slot to fill with a guess.
        <p className="mt-3 border-t border-border pt-3 text-[12px] text-muted">
          That&apos;s everything you&apos;d been looking at. We&apos;ll only
          suggest a new category when you go looking at one.
        </p>
      )}
    </section>
  );
}

function TickIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
