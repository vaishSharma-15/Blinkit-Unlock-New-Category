/**
 * Fills gaps in public/products/ from the Open Food Facts family of databases.
 * Run from the project root:  node scripts/fetch-product-images.mjs
 *
 * Skips any product that already has a photo, so it's safe to re-run — each
 * pass only attempts what's still missing.
 *
 * Two things this script does that a naive version doesn't, both learned the
 * hard way: it sends an identifying User-Agent (Open Food Facts asks for one
 * and blocks anonymous clients), and it waits between requests. Hammering a
 * free volunteer-run API gets you HTML error pages and inconsistent results.
 *
 * Images are CC BY-SA — the attribution in the app footer is required, not
 * decorative. Check each new photo actually matches the product before
 * trusting it; search results are approximate and have returned, for example,
 * a ketchup bottle for "tomato".
 */
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "products");
const CATALOGUE = path.join(process.cwd(), "data", "products.json");

const HEADERS = {
  "User-Agent": "BlinkitUnlockCategoryDemo/0.1 (portfolio project)",
};
const DELAY_MS = 5000;

const DB_FOR_CATEGORY = {
  grocery: "world.openfoodfacts.org",
  snacks: "world.openfoodfacts.org",
  "pet-care": "world.openpetfoodfacts.org",
  skincare: "world.openbeautyfacts.org",
  household: "world.openproductsfacts.org",
  stationery: "world.openproductsfacts.org",
  kitchenware: "world.openproductsfacts.org",
  pharmacy: "world.openproductsfacts.org",
  garden: "world.openproductsfacts.org",
  electronics: "world.openproductsfacts.org",
};

// Brand + product line only. Full catalogue names are too specific to match.
const QUERY = {
  "gro-001": "tomato",
  "gro-002": "amul taaza",
  "gro-004": "fortune sunflower oil",
  "sna-001": "lays magic masala",
  "sna-004": "dairy milk silk",
  "hou-002": "vim dishwash gel",
  "hou-004": "good knight refill",
  "pet-002": "drools adult dog",
  "pet-004": "himalaya erina pet shampoo",
  "skn-001": "minimalist vitamin c serum",
  "stn-001": "classmate notebook",
  "stn-002": "cello ball pen",
  "stn-003": "faber castell colour pencils",
  "stn-004": "fevicol",
  "kit-001": "pigeon knife",
  "pha-001": "band-aid flexible fabric",
  "gro-005": "whole wheat brown bread",
  "gro-006": "india gate basmati rice",
  "gro-007": "tata salt",
  "gro-008": "madhur sugar",
  "gro-011": "tata sampann toor dal",
  "gro-012": "tata tea gold",
  "ele-003": "portronics cable",
};

/**
 * Loose produce and live plants have no barcode, structurally unfindable in
 * a barcode database. Every real attempt for "Fresh Tomato" has matched a
 * ketchup bottle instead — Open Food Facts indexes packaged products, and
 * there is no packaged version of this to find. Same reasoning for loose
 * Onion and Potato. "Ugaoo Money Plant" is the same shape of problem too:
 * it's a living plant in a pot, not a manufactured item with a barcode on a
 * box. Re-running the script won't fix any of these; they need a photo from
 * somewhere that isn't a barcode database, or stay on the category-icon
 * fallback honestly rather than a wrong photo.
 */
const STRUCTURALLY_UNFINDABLE = new Set(["gro-001", "gro-009", "gro-010", "gdn-001"]);

/**
 * Different reason than STRUCTURALLY_UNFINDABLE above, same honest outcome:
 * these do have barcodes, but multiple query attempts (brand name, model
 * name, generic category term) all returned zero results — this database's
 * electronics coverage is genuinely thin, not a matching problem. Re-running
 * won't fix it; these stay on the category-icon fallback until (if ever)
 * someone else contributes a real entry for them upstream.
 */
const NOT_YET_IN_DATABASE = new Set(["ele-001", "ele-002"]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const catalogue = JSON.parse(await fs.readFile(CATALOGUE, "utf8"));
await fs.mkdir(OUT, { recursive: true });

const existing = new Set(
  (await fs.readdir(OUT)).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4)),
);

let fetched = 0;
let missing = 0;

for (const product of catalogue.products) {
  if (
    existing.has(product.id) ||
    STRUCTURALLY_UNFINDABLE.has(product.id) ||
    NOT_YET_IN_DATABASE.has(product.id)
  )
    continue;

  const db = DB_FOR_CATEGORY[product.category];
  const q = (QUERY[product.id] ?? product.name).trim().replace(/\s+/g, "+");
  const url = `https://${db}/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=5`;

  await sleep(DELAY_MS);

  let hit = null;
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(25000),
    });
    const body = await res.text();
    if (body.startsWith("<")) {
      console.log(`RATE-LIMITED at ${product.id} — wait and re-run`);
      break;
    }
    hit = (JSON.parse(body).products || []).find((p) => p.image_front_url);
  } catch (e) {
    console.log(`ERR  ${product.id}  ${e.message}`);
    continue;
  }

  if (!hit) {
    console.log(`MISS ${product.id}  not in database`);
    missing++;
    continue;
  }

  try {
    const img = await fetch(hit.image_front_url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(25000),
    });
    if (!img.ok) throw new Error(`HTTP ${img.status}`);
    const buf = Buffer.from(await img.arrayBuffer());
    await fs.writeFile(path.join(OUT, `${product.id}.jpg`), buf);
    console.log(
      `OK   ${product.id}  matched="${hit.product_name}" — CHECK THIS MATCHES`,
    );
    fetched++;
  } catch (e) {
    console.log(`ERR  ${product.id}  download: ${e.message}`);
  }
}

console.log(`\n${fetched} fetched, ${missing} not in database`);
