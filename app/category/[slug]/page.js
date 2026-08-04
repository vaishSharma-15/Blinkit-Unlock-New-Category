import Link from "next/link";
import { notFound } from "next/navigation";

import BottomNav from "@/components/shell/BottomNav";
import ProductGrid from "@/components/shell/ProductGrid";
import UnlockSection from "@/components/unlock/UnlockSection";
import catalogue from "@/data/products.json";
import { currentDemoCustomer } from "@/lib/demoCustomer";
import { getEligible, rankEligible } from "@/lib/eligibility";
import { withImages } from "@/lib/productImages";

export function generateStaticParams() {
  return catalogue.categories.map((c) => ({ slug: c.slug }));
}

/**
 * Category page. The Unlock card renders above the grid for customers this
 * category is new to; Phase 7 adds the still-curious row and the post-purchase
 * pairing underneath it.
 */
export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const { p: searchedProductId, q: searchedQuery } = await searchParams;
  const category = catalogue.categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const customer = await currentDemoCustomer();
  const products = withImages(catalogue.products).filter(
    (p) => p.category === slug,
  );

  // The specific product the search bar resolved to, if the customer arrived
  // by searching one — "cat food" should feature the cat food, not whichever
  // product this category happens to list first. Falls back to the first
  // product for any other entry point (tapping the category tile, the
  // persistent chip, "New to Explore"), exactly as before.
  const featured =
    products.find((p) => p.id === searchedProductId) ?? products[0];

  const eligible = rankEligible(
    getEligible(customer, {
      availableCategories: catalogue.categories.map((c) => c.slug),
    }),
  );
  const isNewCategory = eligible.some((e) => e.category === slug);

  // The customer's *other* live signals — what "still curious about" offers,
  // and what the post-purchase prompt draws from. Ranked, so the strongest
  // remaining signal leads. Empty is a normal outcome, not a gap to fill.
  const bySlug = new Map(catalogue.categories.map((c) => [c.slug, c]));
  const remaining = eligible
    .filter((e) => e.category !== slug)
    .map((e) => ({ ...bySlug.get(e.category), daysAgo: e.daysAgo }));

  return (
    <div className="flex w-full flex-1 flex-col bg-white">
      {/* Deliberately no demo bar here. It stayed obtrusive perched above app
          chrome on every single page; it now lives on the home page only,
          where a demo naturally starts. The back arrow below is the way back
          to it — this page never needs to switch customer mid-browse, only
          to return to where that choice lives. */}
      <header className="flex items-center gap-3 border-b border-border bg-white px-3 py-3">
        <Link href="/" aria-label="Back" className="-ml-1 p-1">
          <BackIcon />
        </Link>
        <h1 className="text-[16px] font-bold">{category.name}</h1>
        {isNewCategory && (
          <span className="ml-auto rounded-full bg-blinkit-green/10 px-2 py-0.5 text-[10px] font-semibold text-blinkit-green">
            New for you
          </span>
        )}
        {/* The flip side of "New for you" — shown only when this customer has
            actually bought from this category before, never guessed at. A
            category they've simply never touched gets neither badge; calling
            that "regular" would be the same kind of invented claim the rest
            of this feature refuses to make. */}
        {!isNewCategory && customer.purchased.includes(slug) && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-blinkit-yellow/25 px-2 py-0.5 text-[10px] font-semibold text-[#8a6a14]">
            <CartBadgeIcon />
            One of your regulars
          </span>
        )}
      </header>

      <main className="flex-1">
        {/* Only for a category this customer has engaged with but never bought
            from. The card hides itself further if order volume is too thin. */}
        {isNewCategory && featured && (
          <>
            {searchedQuery && (
              <p className="mx-3 mt-3 text-[11px] text-muted">
                Because you searched &ldquo;{searchedQuery}&rdquo;
              </p>
            )}
            <UnlockSection
              product={featured}
              category={category}
              customerId={customer.id}
              remaining={remaining}
            />
          </>
        )}
        <ProductGrid products={products} />
      </main>

      <BottomNav active="categories" />
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function CartBadgeIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}
