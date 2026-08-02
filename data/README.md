# Data layer

The one rule this directory exists to enforce: **real data and simulated data
never share a file.**

| File                 | Status        | Filled in |
| -------------------- | ------------- | --------- |
| `products.json`      | **REAL**      | Phase 2   |
| `reviews.json`       | **REAL**      | Phase 2   |
| `sampleCustomers.js` | **SIMULATED** | Phase 2   |

`products.json` and `reviews.json` hold real product review text — the AI
summaries and answers must be genuinely grounded in it, never invented.

`sampleCustomers.js` stands in for a Blinkit backend we don't have access to.
Its engagement and purchase histories are illustrative, not real, and the
filename says so on purpose.

## Product photos

`public/products/<product-id>.jpg` — real photos from the [Open Food Facts](https://world.openfoodfacts.org)
family of open databases, licensed **CC BY-SA**. The attribution in the app
footer is a licence requirement, not decoration.

Products without a photo fall back to an emoji tile. To fill a gap, drop
`<product-id>.jpg` into `public/products/` — [lib/productImages.js](../lib/productImages.js)
picks it up automatically, no JSON edit needed.

`node scripts/fetch-product-images.mjs` attempts the remaining gaps.
