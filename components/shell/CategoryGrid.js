import Link from "next/link";

import CategoryIcon from "./CategoryIcon";

/**
 * Blinkit's home-screen category tiles — the app's primary navigation.
 * Four across, tinted tile per category, links through to the category page.
 *
 * Categories the customer added to their frequent list (Phase 7's post-purchase
 * button) sort to the front and carry a "Yours" tag. Nothing lands here on its
 * own: a category only appears pinned because the customer tapped the button.
 *
 * A category in `eligibleSlugs` gets a small green sparkle instead, unless
 * it's already pinned (that badge wins — it's the stronger, already-acted-on
 * signal). Same rule as the Unlock card itself: shown interest, never bought.
 */
const TINTS = [
  "bg-[#fff3e0]",
  "bg-[#e8f5e9]",
  "bg-[#e3f2fd]",
  "bg-[#fce4ec]",
  "bg-[#f3e5f5]",
  "bg-[#fff9c4]",
];

export default function CategoryGrid({ categories, frequent = [], eligibleSlugs }) {
  const pinned = new Set(frequent);

  // Tint is keyed to the catalogue position, not the display position, so
  // pinning a category doesn't repaint the whole grid.
  const tinted = categories.map((category, i) => ({
    ...category,
    tint: TINTS[i % TINTS.length],
    pinned: pinned.has(category.slug),
  }));
  const ordered = [
    ...tinted.filter((c) => c.pinned),
    ...tinted.filter((c) => !c.pinned),
  ];

  return (
    <section className="px-3 pt-4">
      <h2 className="mb-3 text-[15px] font-bold">Shop by category</h2>
      <ul className="grid grid-cols-4 gap-x-2 gap-y-3">
        {ordered.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/category/${category.slug}`}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <span
                className={`relative flex aspect-square w-full items-center justify-center rounded-xl text-foreground/70 ${category.tint}`}
                aria-hidden="true"
              >
                <CategoryIcon slug={category.slug} size={26} />
                {category.pinned ? (
                  <span className="pin-pop absolute inset-x-0 top-0 rounded-t-xl bg-blinkit-green px-1 py-0.5 text-center text-[7px] leading-tight font-bold text-white">
                    New Category Explored
                  </span>
                ) : (
                  eligibleSlugs?.has(category.slug) && (
                    <span
                      title="You've shown interest here but never bought from it"
                      aria-hidden="true"
                      className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blinkit-green text-white shadow-sm"
                    >
                      <SparkleIcon />
                    </span>
                  )
                )}
              </span>
              <span className="text-[10px] leading-tight font-medium">
                {category.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </svg>
  );
}
