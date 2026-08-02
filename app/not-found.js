import Link from "next/link";

/**
 * Rendered when the category page calls notFound() for a slug that isn't in
 * the catalogue. Deliberately offers the home screen rather than guessing at
 * a "did you mean" — the whole feature rests on never suggesting a category
 * the customer didn't ask for.
 */
export default function NotFound() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-16 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <h1 className="text-[15px] font-bold">We don&apos;t stock that yet</h1>
      <p className="text-[12px] leading-relaxed text-muted">
        That category isn&apos;t in the catalogue.
      </p>
      <Link
        href="/"
        className="mt-1 rounded-lg bg-blinkit-green px-4 py-2.5 text-[13px] font-bold text-white"
      >
        Back to shopping
      </Link>
    </div>
  );
}
