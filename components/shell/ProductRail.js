import Link from "next/link";
import ProductCard from "./ProductCard";

/**
 * Horizontally scrolling product row with a "see all" link — Blinkit's home
 * screen is stacked rails like this, one per category.
 */
export default function ProductRail({ title, slug, products }) {
  if (products.length === 0) return null;

  return (
    <section className="pt-4">
      <div className="flex items-baseline justify-between px-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <Link
          href={`/category/${slug}`}
          className="text-[13px] font-semibold text-blinkit-green"
        >
          see all
        </Link>
      </div>

      <ul className="mt-2 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <li key={product.id} className="w-[42vw] max-w-[160px] shrink-0">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
