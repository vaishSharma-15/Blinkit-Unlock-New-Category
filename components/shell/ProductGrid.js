import ProductCard from "./ProductCard";

/** Two-column grid, used on category pages. */
export default function ProductGrid({ products }) {
  return (
    <ul className="grid grid-cols-2 gap-2 px-3 py-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
