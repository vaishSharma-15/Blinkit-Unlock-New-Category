import BottomNav from "@/components/shell/BottomNav";
import CategoryGrid from "@/components/shell/CategoryGrid";
import CategoryTabs from "@/components/shell/CategoryTabs";
import Header from "@/components/shell/Header";
import ProductRail from "@/components/shell/ProductRail";
import PromoGrid from "@/components/shell/PromoGrid";
import SearchBar from "@/components/shell/SearchBar";
import NewToExplore from "@/components/unlock/NewToExplore";
import StillCuriousRow from "@/components/unlock/StillCuriousRow";
import catalogue from "@/data/products.json";
import { rankPopularCategories } from "@/lib/categoryPopularity";
import { currentDemoCustomer } from "@/lib/demoCustomer";
import { getEligible, isMAC, rankEligible } from "@/lib/eligibility";
import { GENERIC_SUGGESTIONS, buildNudges } from "@/lib/nudge";
import { withImages } from "@/lib/productImages";

export default async function Home() {
  const customer = await currentDemoCustomer();
  const products = withImages(catalogue.products);
  const mac = isMAC(customer);

  const eligible = rankEligible(
    getEligible(customer, {
      availableCategories: catalogue.categories.map((c) => c.slug),
    }),
  );

  // One chip per eligible category, cycled through a slot that is always on
  // screen. A customer with no signal gets an empty list, and no chip renders.
  const nudges = buildNudges(eligible, catalogue.categories);

  // The fixed, non-personalized shelf for a MAC with no signal of their own.
  // Never computed for anyone else — a customer with a real signal gets the
  // personalized chip instead, not both.
  const showNewToExplore = mac && eligible.length === 0;
  const popularCategories = showNewToExplore
    ? rankPopularCategories(catalogue.categories, catalogue.products)
    : [];

  // Every eligible category, for the home page's own "Still curious about"
  // row — unlike the category page's version, nothing here is excluded as
  // "the one already featured," since Home doesn't feature any single one.
  const bySlug = new Map(catalogue.categories.map((c) => [c.slug, c]));
  const eligibleCategories = eligible.map((e) => bySlug.get(e.category));

  return (
    <div className="flex w-full flex-1 flex-col bg-white">
      {/* One continuous yellow block: header, search, tab strip, campaign —
          exactly the run the real app opens with. White starts below it.
          The demo customer switcher lives in the header's own Account
          circle now — see ProfileSwitcher. */}
      <Header customerName={customer.name} customerId={customer.id} />
      <SearchBar
        suggestions={GENERIC_SUGGESTIONS}
        nudges={nudges}
        categories={catalogue.categories}
        products={catalogue.products}
        purchased={customer.purchased}
        isMac={isMAC(customer)}
        customerId={customer.id}
      />
      <CategoryTabs active="all" />

      <main className="flex-1 pb-24">
        {showNewToExplore && (
          <NewToExplore categories={popularCategories} customerId={customer.id} />
        )}

        {eligibleCategories.length > 0 && (
          <StillCuriousRow categories={eligibleCategories} />
        )}

        <PromoGrid categories={catalogue.categories} />

        <ProductRail
          title="Frequently bought"
          slug="grocery"
          products={products.slice(0, 8)}
        />

        <CategoryGrid
          categories={catalogue.categories}
          frequent={customer.frequent}
        />

        {catalogue.categories.map((category) => (
          <ProductRail
            key={category.slug}
            title={category.name}
            slug={category.slug}
            products={products.filter((p) => p.category === category.slug)}
          />
        ))}

        {/* Open Food Facts images are CC BY-SA — attribution is required. */}
        <footer className="mt-6 px-4 text-[10px] leading-relaxed text-muted">
          Demo build{eligible.length > 0 ? " · exploration signal detected" : ""}.
          Product photos from{" "}
          <a
            href="https://world.openfoodfacts.org"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Open Food Facts
          </a>{" "}
          and its sister databases, licensed CC BY-SA.
        </footer>
      </main>

      <BottomNav active="home" />
    </div>
  );
}
