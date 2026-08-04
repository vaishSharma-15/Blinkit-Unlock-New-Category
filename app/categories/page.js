import Link from "next/link";

import AppFooterMark from "@/components/shell/AppFooterMark";
import BottomNav from "@/components/shell/BottomNav";
import CategoryGrid from "@/components/shell/CategoryGrid";
import catalogue from "@/data/products.json";
import { currentDemoCustomer } from "@/lib/demoCustomer";

/**
 * A real destination for the bottom nav's Categories tab, which previously
 * just linked to "/" like every other tab — tapping it did nothing a
 * customer could tell apart from Home. This is the honest fix: an actual
 * page listing every category, each one a real link into `/category/[slug]`
 * — the same page the search bar and the personalised chip route to, where
 * the Unlock card renders if this customer is eligible for it. Categories is
 * now a genuine second way into the feature, not a dead tab.
 */
export default async function CategoriesPage() {
  const customer = await currentDemoCustomer();

  return (
    <div className="flex w-full flex-1 flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-border bg-white px-3 py-3">
        <Link href="/" aria-label="Back" className="-ml-1 p-1">
          <BackIcon />
        </Link>
        <h1 className="text-[16px] font-bold">Categories</h1>
      </header>

      <main className="flex-1 pb-6">
        <CategoryGrid
          categories={catalogue.categories}
          frequent={customer.frequent}
        />
        <AppFooterMark />
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
