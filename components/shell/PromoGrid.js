import Link from "next/link";

import CategoryIcon from "./CategoryIcon";

/**
 * The campaign block that sits on the yellow, under the tab strip: a banner
 * wordmark, then a tall card on the left with a stack of two on the right,
 * then a full-width dark banner.
 *
 * The layout is Blinkit's. The content is ours — the live app runs licensed
 * seasonal creative here, which isn't ours to reproduce, so these tiles point
 * at real categories in this catalogue instead of at a campaign.
 */
export default function PromoGrid({ categories = [] }) {
  const has = (slug) => categories.some((c) => c.slug === slug);
  const href = (slug) => (has(slug) ? `/category/${slug}` : "/");

  return (
    <section className="bg-blinkit-yellow px-3 pt-3 pb-5">
      <div className="mb-3 text-center">
        <p className="text-[11px] font-bold tracking-[0.35em] text-black/70">
          CELEBRATE
        </p>
        <p className="text-[26px] leading-tight font-extrabold tracking-tight text-[#1a5fb4]">
          EVERY DAY
        </p>
      </div>

      {/* Three columns: one tall card down the left, a 2×2 block beside it. */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href={href("snacks")}
          className="row-span-2 flex flex-col rounded-2xl bg-[#fdf6e3] p-2.5"
        >
          <p className="text-[12px] leading-tight font-extrabold">
            Snacks, Drinks &amp; More
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="rounded bg-black px-1 py-0.5 text-[9px] font-bold text-white line-through">
              ₹249
            </span>
            <span className="rounded bg-blinkit-yellow px-1 py-0.5 text-[11px] font-extrabold">
              ₹79
            </span>
          </div>
          <p className="mt-1 text-[11px] font-bold">Party Pack</p>
          <span className="mt-auto flex justify-center pt-2 text-[#1a5fb4]">
            <CategoryIcon slug="snacks" size={34} />
          </span>
        </Link>

        <PromoTile href={href("household")} title="Home Corner" slug="household" />
        <PromoTile href={href("pet-care")} title="Party With Pets" slug="pet-care" />
        <PromoTile href={href("grocery")} title="Fruits & Veg" slug="grocery" />
        <PromoTile
          href={href("skincare")}
          title="Self-Care Day"
          slug="skincare"
          footnote="Every day"
        />
      </div>

      <Link
        href={href("stationery")}
        className="mt-2.5 flex items-center justify-between rounded-2xl bg-[#12275c] px-4 py-3.5 text-white"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-wide text-white/70">
            BACK TO SCHOOL
          </p>
          <p className="truncate text-[15px] font-extrabold">
            Notebooks, pens &amp; more
          </p>
          <p className="text-[11px] text-white/80">Shop the stationery aisle</p>
        </div>
        <span className="shrink-0 text-[22px]" aria-hidden="true">
          ›
        </span>
      </Link>
    </section>
  );
}

function PromoTile({ href, title, slug, footnote }) {
  return (
    <Link
      href={href}
      className="flex flex-col overflow-hidden rounded-2xl bg-[#fdf6e3] p-2.5"
    >
      <p className="text-[11px] leading-tight font-bold">{title}</p>
      <span className="mt-1 flex justify-center text-[#1a5fb4]">
        <CategoryIcon slug={slug} size={26} />
      </span>
      {footnote && (
        <span className="-mx-2.5 -mb-2.5 mt-1 bg-[#fde2e6] py-0.5 text-center text-[9px] font-bold">
          {footnote}
        </span>
      )}
    </Link>
  );
}
