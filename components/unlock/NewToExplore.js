"use client";

import Link from "next/link";

import CategoryIcon from "@/components/shell/CategoryIcon";
import { readCookie, writeCookie } from "@/lib/clientCookie";
import { SEARCHED_COOKIE, addScoped } from "@/lib/demoSession";

/**
 * The entry point for a Monthly Active Customer with no personal signal at
 * all — no search, no browse, nothing outside groceries. The personalized
 * chip has nothing to build a nudge from for this customer, and the company
 * goal counts every MAC, not only the ones with a signal.
 *
 * The one rule this section exists to enforce: the categories shown are fixed
 * — computed once from real aggregate order data across every customer, never
 * this one specifically. See lib/categoryPopularity.js. No engagement, no
 * purchase history, no similar-customer comparison ever touches this list.
 * The label says so honestly: "Popular first tries," never "for you."
 *
 * Tapping a tile is where personalization is allowed back in — that tap is
 * this customer's own action, recorded the same way a live search is
 * recorded elsewhere in this app. From that point on the category page runs
 * the identical Unlock card, guarantee, and ask box as the personalized path;
 * nothing downstream knows or cares that the entry point was this shelf
 * rather than a search.
 */
export default function NewToExplore({ categories, customerId }) {
  if (!categories.length) return null;

  function recordVisit(slug) {
    if (!customerId) return;
    writeCookie(
      SEARCHED_COOKIE,
      addScoped(readCookie(SEARCHED_COOKIE), customerId, slug),
    );
  }

  return (
    <section className="mx-3 mt-4 rounded-xl border border-border bg-white p-3">
      <h2 className="text-[13px] font-bold">Popular first tries</h2>
      <p className="mt-0.5 text-[10px] text-muted">
        The categories customers reorder from most, with the fewest returns —
        not picked for you specifically.
      </p>

      <ul className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <Link
              href={`/category/${category.slug}`}
              onClick={() => recordVisit(category.slug)}
              className="flex w-[104px] flex-col items-center gap-1 rounded-xl border border-border bg-[#f8f8f8] px-2 py-3 text-center"
            >
              <span className="text-blinkit-green" aria-hidden="true">
                <CategoryIcon slug={category.slug} size={26} />
              </span>
              <span className="text-[11px] font-semibold leading-tight">
                {category.name}
              </span>
              <span className="text-[9px] text-blinkit-green">
                {category.reorderRate}% reorder
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
