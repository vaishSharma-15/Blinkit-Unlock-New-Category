import fs from "node:fs";
import path from "node:path";

/**
 * Server-only. Reads public/products/ at render time and attaches an `image`
 * path to any product with a matching `<id>.jpg`.
 *
 * Convention over configuration: to fill a gap, drop `<product-id>.jpg` into
 * public/products/ and it appears. No edit to products.json needed. Products
 * without a photo fall back to their emoji tile.
 */
const DIR = path.join(process.cwd(), "public", "products");

export function withImages(products) {
  let available;
  try {
    available = new Set(
      fs
        .readdirSync(DIR)
        .filter((f) => f.endsWith(".jpg"))
        .map((f) => f.replace(/\.jpg$/, "")),
    );
  } catch {
    // Folder missing entirely — every product falls back to its emoji.
    available = new Set();
  }

  return products.map((product) =>
    available.has(product.id)
      ? { ...product, image: `/products/${product.id}.jpg` }
      : product,
  );
}
