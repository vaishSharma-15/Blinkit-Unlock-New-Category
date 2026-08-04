"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProductPhotoFallback } from "./CategoryIcon";

/**
 * A single Blinkit product card: image tile, delivery badge, name, unit, then
 * price and ADD on one row.
 *
 * Products with a real photo in public/products/ render it. The rest fall
 * back to that product's category icon on a muted tile — deliberately not an
 * emoji standing in for a missing photo. See lib/productImages.js for which
 * products currently have a sourced photo.
 *
 * The photo, name, and unit are wrapped in a link to this product's own
 * Unlock card (`?p=<id>`, the same query param the search bar already uses to
 * feature a specific product) — so a customer browsing the grid can open any
 * product's real summary and ask box, not only whichever one a search
 * happened to land on. The ADD button stays outside that <Link> to keep the
 * row valid markup (a button nested in an anchor is invalid), but this is a
 * demo of the Unlock flow, not a real cart — so ADD takes you to the same
 * Unlock card via router.push rather than silently adding to a cart nothing
 * else in the app reads.
 *
 * `eligible` marks a product whose category the current customer has shown
 * real interest in but never bought from — the same rule that decides
 * whether the Unlock card renders once you land on it. Home mixes every
 * category into its rails like the real app does, so this small sparkle is
 * the one visual cue for which taps actually open the card, without hiding
 * or stripping down anything else on the page.
 */
export default function ProductCard({ product, eligible = false }) {
  const router = useRouter();
  const discount = product.mrp > product.price;
  const percentOff = discount
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const href = `/category/${product.category}?p=${product.id}`;

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-white p-2">
      <Link href={href}>
        <div className="relative mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-[#f7f7f8]">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 448px) 45vw, 200px"
              className="object-contain p-2"
            />
          ) : (
            <ProductPhotoFallback category={product.category} />
          )}
          {discount && (
            <span className="absolute top-0 left-0 rounded-tl-lg rounded-br-lg bg-[#256fef] px-1.5 py-0.5 text-[9px] leading-tight font-bold text-white">
              {percentOff}% OFF
            </span>
          )}
          {eligible && (
            <span
              title="You've shown interest in this category but never bought from it"
              className="absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-blinkit-green px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm"
            >
              <SparkleIcon />
              Explore
            </span>
          )}
        </div>

        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-muted">
          <ClockIcon />
          12 MINS
        </p>

        <h3 className="line-clamp-2 text-[13px] leading-snug font-medium">
          {product.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-muted">{product.unit}</p>
      </Link>

      <div className="mt-auto flex items-end justify-between gap-1 pt-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">₹{product.price}</p>
          {discount && (
            <p className="text-[11px] text-muted line-through">₹{product.mrp}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push(href)}
          className="shrink-0 rounded-lg border border-blinkit-green bg-blinkit-green/5 px-4 py-1.5 text-[12px] font-bold text-blinkit-green transition-colors hover:bg-blinkit-green/10"
        >
          ADD
        </button>
      </div>
    </article>
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
      className="shrink-0"
    >
      <path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
