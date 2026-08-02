import Link from "next/link";

import CategoryIcon from "@/components/shell/CategoryIcon";

/**
 * "Still curious about" — the second and third eligible categories, shown
 * below the Unlock card.
 *
 * Every entry here comes from this customer's own searches and browses. There
 * is no "customers like you" behind it, and there is no filler: if the list is
 * empty the row does not render at all.
 *
 * It also only renders when the card above it rendered. A still-curious row
 * hanging under nothing would be a suggestion with no evidence attached.
 */
export default function StillCuriousRow({ categories }) {
  if (!categories?.length) return null;

  return (
    <section className="mx-3 mt-2 rounded-xl border border-border bg-white p-3">
      <h3 className="text-[12px] font-bold">Still curious about</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/category/${category.slug}`}
              className="flex items-center gap-1.5 rounded-full border border-blinkit-green/40 bg-blinkit-green/5 px-3 py-1.5 text-[12px] font-semibold text-blinkit-green"
            >
              <CategoryIcon slug={category.slug} size={15} />
              {category.name}
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-muted">
        From what you searched for yourself — nothing borrowed from anyone
        else&apos;s history.
      </p>
    </section>
  );
}
