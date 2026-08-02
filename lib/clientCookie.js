"use client";

/**
 * Tiny cookie read/write for demo session state (purchases, pins, live
 * searches) — client-only. The server-side read of the same cookie names
 * lives in lib/demoCustomer.js, via next/headers.
 */

export function readCookie(name) {
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? ""
  );
}

/** `maxAge` in seconds; pass 0 to clear the cookie instead of setting it. */
export function writeCookie(name, value, { maxAge = 31536000 } = {}) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}
