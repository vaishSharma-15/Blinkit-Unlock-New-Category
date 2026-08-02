"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CategoryIcon from "./CategoryIcon";
import { readCookie, writeCookie } from "@/lib/clientCookie";
import { SEARCHED_COOKIE, addScoped } from "@/lib/demoSession";
import {
  buildProductIndex,
  buildSearchIndex,
  isSearchWorthNudging,
  matchSearch,
} from "@/lib/searchSignal";

/** The plain placeholder cycles; the personalised chip beside it does not. */
const ROTATE_MS = 2800;

/** How long each nudge holds the chip when a customer has more than one. */
const NUDGE_MS = 5000;

/**
 * How long to let typing settle before matching against the catalogue.
 *
 * Longer than the placeholder-rotation debounce on purpose: this one gates a
 * clickable navigation link, not just cosmetic text. A short debounce turned
 * a normal mid-word pause — type "nail", think for a moment, continue with
 * "paint" — into a brief but real, tappable "New for you: Skincare" panel,
 * because "nail" alone is a genuine prefix of the stored "nailpolish" term.
 * This doesn't eliminate that class of flicker (a long enough pause can still
 * trigger it, for any word that happens to share a prefix with something
 * indexed), but it meaningfully narrows the window a normal typing rhythm
 * lands in it.
 */
const SEARCH_DEBOUNCE_MS = 450;

/**
 * Blinkit's search bar: a pale pill sitting inside the yellow header, magnifier
 * on the left, a hairline divider and a mic on the right.
 *
 * Three separate signals live here, and keeping them separate is the point:
 *
 * - `suggestions` — the generic rotating placeholder. Plain text, no sparkle,
 *   what every customer sees. This is the control state.
 * - `nudges` — the customer's own *historical* eligible categories, as a
 *   persistent sparkle chip. Always on screen, never something you can miss.
 * - the live-search panel below the bar — fires from what the customer is
 *   *typing right now*. Tries to pin down a specific PRODUCT first ("cat
 *   food" → the actual cat food, not whichever product happens to be listed
 *   first in Pet Care), and only falls back to a bare category match when
 *   nothing product-level fits. Matching is local and instant — a lookup
 *   against the catalogue, not a model call — because nothing AI-generated
 *   can keep pace with a keystroke, and the free tier's quota couldn't
 *   survive trying.
 *
 * Enter submits the same match immediately, without waiting for the debounce
 * — and if nothing matches, says so plainly instead of doing nothing. A
 * search that goes silent when you press Enter feels broken even when "no
 * match" is the honest, correct answer; saying so is what makes it feel like
 * an answer instead of a dead end.
 */
export default function SearchBar({
  suggestions,
  nudges = [],
  categories = [],
  products = [],
  purchased = [],
  isMac = false,
  customerId,
  currentSlug = null,
  // Smaller pill, tighter spacing — used on the category page, where the bar
  // sits directly under the header rather than owning its own prominent row
  // the way it does on Home. The matching logic underneath is identical.
  compact = false,
}) {
  const router = useRouter();
  const items = suggestions.map((s) =>
    typeof s === "string" ? { text: s } : s,
  );

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [nudgeIndex, setNudgeIndex] = useState(0);
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (items.length <= 1) return;

    // Fade the current suggestion out, swap it, fade the next one in.
    const swap = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, 250);
    }, ROTATE_MS);

    return () => clearInterval(swap);
  }, [items.length]);

  useEffect(() => {
    if (nudges.length <= 1) return;

    const cycle = setInterval(() => {
      setNudgeIndex((i) => (i + 1) % nudges.length);
    }, NUDGE_MS);

    return () => clearInterval(cycle);
  }, [nudges.length]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const categoryIndex = useMemo(
    () => buildSearchIndex(categories, products),
    [categories, products],
  );
  const productIndex = useMemo(() => buildProductIndex(products), [products]);

  /**
   * Resolve a query to a real destination, or null if nothing is stocked.
   * Shared by the live-typing panel (called with the debounced value) and by
   * Enter (called with the *current* value) — Enter is an explicit "I'm done
   * typing" signal and must not wait out the debounce meant for smoothing
   * keystrokes, or a fast type-then-Enter reads the stale, empty match from
   * before typing settled.
   *
   * Finding a real product/category and being worth NUDGING about are two
   * different questions, kept separate here on purpose. Every sample
   * customer already has "grocery" in their purchased list — nobody is ever
   * "new" to groceries, that's the point of the Unlock feature only covering
   * categories someone hasn't shopped yet. Folding that nudge-eligibility
   * check into the *only* path to a destination meant searching "bread" told
   * a customer "we don't have that" even though it's genuinely on the shelf
   * — the search was conflating "not nudge-worthy" with "doesn't exist".
   * `nudgeWorthy` now only gates the green sparkle framing below; a genuine
   * match always gets a real destination to navigate to.
   */
  function resolveDestination(query) {
    const match = matchSearch(query, { categoryIndex, productIndex });
    if (!match) return null;
    const category = categories.find((c) => c.slug === match.categorySlug);
    if (match.categorySlug === currentSlug || !category) return null;
    const product =
      match.type === "product"
        ? products.find((p) => p.id === match.productId)
        : null;
    // The raw typed query rides along too, not just the resolved product —
    // so the destination can honestly show what the customer searched
    // ("blush") even on a category-only match where no product's name
    // actually contains that word.
    const params = new URLSearchParams({ q: query.trim() });
    if (product) params.set("p", product.id);
    const href = `/category/${category.slug}?${params.toString()}`;
    const nudgeWorthy = isSearchWorthNudging({
      slug: match.categorySlug,
      purchased,
      isMac,
    });
    // Distinct from "not nudge-worthy" in general (which also covers a
    // non-MAC customer, or a category with no signal at all) — this is
    // specifically true when the reason is "you already shop here," the one
    // case that gets its own honest copy below rather than the generic
    // plain-link panel.
    const alreadyPurchased = purchased.includes(match.categorySlug);
    return { match, category, product, href, nudgeWorthy, alreadyPurchased };
  }

  // Not memoized: matchSearch is a cheap local lookup against a small
  // catalogue, and the component already re-renders on every keystroke via
  // `value` — memoizing this added a dependency-array footgun (a stale
  // closure over `purchased`/`isMac`/etc.) for no measurable benefit.
  const live = resolveDestination(debounced);

  function recordSearch(categorySlug) {
    if (!customerId || !categorySlug) return;
    writeCookie(
      SEARCHED_COOKIE,
      addScoped(readCookie(SEARCHED_COOKIE), customerId, categorySlug),
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    const destination = resolveDestination(value);
    if (destination) {
      recordSearch(destination.match.categorySlug);
      router.push(destination.href);
    }
    // No destination: the "we don't have that" message below is already
    // live off `debounced` (see its render condition), so Enter needs no
    // separate handling here — it doesn't need to wait for a submit to say
    // so, the same way it doesn't need to wait to navigate on a real match.
  }

  const nudge = nudges[nudgeIndex % (nudges.length || 1)];

  return (
    // Pins to the top on scroll, the way the real app's does once the delivery
    // header scrolls away. Compact mode sits flush under the category header
    // (near the "New for you" badge) with almost no padding of its own,
    // rather than owning a tall row the way Home's does.
    <div
      className={`sticky top-0 z-20 bg-blinkit-yellow ${
        compact ? "px-3 pt-1 pb-1" : "px-4 pt-2 pb-1"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 rounded-full bg-[#fdea9e] ${
          compact ? "py-1.5 pr-2.5 pl-3" : "py-3 pr-3 pl-4"
        }`}
      >
        <SearchIcon small={compact} />

        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Search for products"
            enterKeyHint="search"
            className={`w-full bg-transparent font-medium outline-none placeholder:text-transparent ${
              compact ? "text-[12.5px]" : "text-[15px]"
            }`}
            placeholder="Search"
          />

          {/* Rotating hint, shown only while the field is empty. aria-hidden so
              screen readers get the stable label above instead of churn. */}
          {value === "" && items[index] && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 flex items-center truncate font-medium text-black/60 transition-opacity duration-250 motion-reduce:transition-none ${
                compact ? "text-[12.5px]" : "text-[15px]"
              } ${visible ? "opacity-100" : "opacity-0"}`}
            >
              {items[index].text}
            </span>
          )}
        </div>

        {nudge && !compact && (
          <Link
            href={nudge.href}
            aria-label={nudge.label}
            title={nudge.label}
            className="flex max-w-[42%] shrink-0 items-center gap-1 rounded-full bg-blinkit-green px-2.5 py-1.5 text-[11px] font-bold text-white"
          >
            <Sparkle />
            <span className="truncate">{nudge.short}</span>
          </Link>
        )}

        <span className="h-5 w-px shrink-0 bg-black/20" aria-hidden="true" />
        <button type="submit" aria-label="Search" className="shrink-0">
          <MicIcon small={compact} />
        </button>
      </form>

      {/* Fires from what's typed right now, not from history. Only for a
          category this customer is a Monthly Active Customer for and hasn't
          bought from — same trust rule as every other nudge in the app.
          A real match that isn't nudge-worthy (already shopped that
          category — true for "grocery" on every sample customer) still gets
          a working destination via Enter, just without this sparkle framing;
          see resolveDestination's comment for why those are kept separate. */}
      {live && live.nudgeWorthy && (
        <Link
          href={live.href}
          onClick={() => recordSearch(live.match.categorySlug)}
          className="mt-2 flex items-center gap-2.5 rounded-xl border border-blinkit-green/30 bg-white px-3 py-2.5 shadow-sm"
        >
          <span className="text-blinkit-green" aria-hidden="true">
            <CategoryIcon slug={live.category.slug} size={26} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-[12px] font-bold text-blinkit-green">
              <Sparkle />
              New for you: {live.product ? live.product.name : live.category.name}
            </span>
            <span className="block truncate text-[11px] text-muted">
              {live.product
                ? `in ${live.category.name} — you haven't ordered from here before`
                : "You haven't ordered from here before — take a look?"}
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-blinkit-green">
            →
          </span>
        </Link>
      )}

      {/* A real match that just isn't a "new category" nudge — plain, no
          sparkle, no claim about never having ordered here before (that
          would often be false, e.g. groceries). Still a real link so typing
          "bread" visibly goes somewhere instead of looking like nothing
          happened until Enter is pressed. */}
      {live && !live.nudgeWorthy && (
        <Link
          href={live.href}
          onClick={() => recordSearch(live.match.categorySlug)}
          className="mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm"
        >
          <span className="text-muted" aria-hidden="true">
            <CategoryIcon slug={live.category.slug} size={26} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold">
              {live.product ? live.product.name : live.category.name}
            </span>
            <span className="block truncate text-[11px] text-muted">
              {live.alreadyPurchased
                ? `You already shop ${live.category.name} with us`
                : `in ${live.category.name}`}
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-muted">
            →
          </span>
        </Link>
      )}

      {/* Live off the debounced value, same as the two match panels above —
          shows as soon as typing settles on something that matches nothing,
          not only after Enter is pressed. Enter still works as a shortcut
          to the same honest answer, it just no longer gates it. */}
      {!live && debounced.trim().length > 0 && (
        <p className="mt-2 rounded-xl border border-border bg-white px-3 py-2.5 text-[11.5px] text-muted">
          We don&apos;t have a demo category for &ldquo;{debounced.trim()}&rdquo; yet — nothing
          invented to fill the gap. Try Pet Care or Skincare for the full
          experience.
        </p>
      )}
    </div>
  );
}

function SearchIcon({ small }) {
  const s = small ? 16 : 20;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function MicIcon({ small }) {
  const s = small ? 16 : 20;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M11 19h2v3h-2z" />
    </svg>
  );
}

/** Personalised entries only. Never rendered beside a generic suggestion. */
function Sparkle() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </svg>
  );
}
