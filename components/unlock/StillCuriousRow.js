import Link from "next/link";

import CategoryIcon from "@/components/shell/CategoryIcon";

/**
 * "Still curious about" — the second and third eligible categories, shown
 * below the Unlock card (and, on Home, every eligible category at once).
 *
 * Every entry here comes from this customer's own searches and browses. There
 * is no "customers like you" behind it, and there is no filler: if the list is
 * empty the row does not render at all.
 *
 * A single slim, horizontally-scrolling ribbon rather than a stacked card —
 * the explanatory sentences that used to sit above and below the chips
 * ("pick up right where you left off," "nothing borrowed from anyone else's
 * history") still exist, just as the row's accessible name and a hover
 * tooltip, not as vertical space every viewer pays for on every visit.
 *
 * It also only renders when the card above it rendered (on a category page —
 * Home has no card to hang it below). A still-curious row hanging under
 * nothing would be a suggestion with no evidence attached.
 */
export default function StillCuriousRow({ categories }) {
  if (!categories?.length) return null;

  return (
    <section
      aria-label="Still curious about — pick up right where you left off"
      title="From what you searched for yourself — nothing borrowed from anyone else's history."
      className="mx-3 mt-2 overflow-x-auto rounded-2xl border border-blinkit-green/15 bg-gradient-to-r from-blinkit-green/10 to-blinkit-yellow/10 p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 items-center gap-1 rounded-xl bg-blinkit-green px-2.5 py-2 text-[10.5px] font-bold whitespace-nowrap text-white shadow-sm">
          <SparkleIcon />
          Still curious
        </span>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white py-1.5 pr-3 pl-1.5 text-[11.5px] font-bold whitespace-nowrap text-foreground shadow-sm ring-1 ring-blinkit-green/10 transition-transform active:scale-95"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blinkit-green/10 text-blinkit-green">
              <CategoryIcon slug={category.slug} size={14} />
            </span>
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </svg>
  );
}
