"use client";

import { useEffect } from "react";

/**
 * Page-level error boundary.
 *
 * The Unlock card already handles its own failures by hiding itself — an
 * absent card is honest, an empty one isn't. This catches the layer above:
 * a render that fails outright should still look like the app rather than a
 * stack trace, and should offer a way back in.
 *
 * `unstable_retry` re-runs the failed segment. Note the name: this is the
 * current App Router API, not the older `reset` prop.
 */
export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    // No error-reporting service wired up for a demo, but the digest is what
    // you'd correlate against server logs in a real deployment.
    console.error(error);
  }, [error]);

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
        <path d="M4 6h2l1.4 11.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.8L20 9H7" />
        <circle cx="9.5" cy="21" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="21" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      <h1 className="text-[15px] font-bold">This screen didn&apos;t load</h1>
      <p className="text-[12px] leading-relaxed text-muted">
        Something went wrong on our side, not yours. Nothing was ordered and
        nothing was charged.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-1 rounded-lg bg-blinkit-green px-4 py-2.5 text-[13px] font-bold text-white"
      >
        Try again
      </button>
      {error?.digest && (
        <p className="text-[10px] text-muted">Reference: {error.digest}</p>
      )}
    </div>
  );
}
