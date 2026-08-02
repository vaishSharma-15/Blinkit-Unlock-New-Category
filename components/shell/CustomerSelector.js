"use client";

import { useRouter } from "next/navigation";
import { sampleCustomers } from "@/data/sampleCustomers";
import { isMAC } from "@/lib/eligibility";
import { FREQUENT_COOKIE, PURCHASED_COOKIE, SEARCHED_COOKIE } from "@/lib/demoSession";

/**
 * Demo-only control for switching which sample customer you're viewing as.
 *
 * Deliberately styled as an obvious debug bar, not app chrome — a viewer must
 * never mistake this simulated engagement history for real Blinkit data.
 *
 * Stored in a cookie so server components can read it (the eligibility engine
 * runs server-side) and so the choice survives navigation between pages.
 */
export default function CustomerSelector({ current }) {
  const router = useRouter();

  function choose(id) {
    document.cookie = `demoCustomer=${id}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  /**
   * Clears everything this demo session has recorded — purchases, pins, and
   * live searches — so any customer can be walked through again from a clean
   * slate. Sample history itself is in the data file and is never touched.
   *
   * SEARCHED_COOKIE has to be in this list for the same reason the other two
   * are: a live search is deliberately treated as a real, persisting signal
   * (that's the whole point of the feature), which means testing it against
   * a "no signal" customer like Meera permanently gives her one — Reset is
   * the only way back to her original zero-signal state.
   */
  function reset() {
    for (const name of [PURCHASED_COOKIE, FREQUENT_COOKIE, SEARCHED_COOKIE]) {
      document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
    }
    router.refresh();
  }

  const customer = sampleCustomers.find((c) => c.id === current);

  return (
    // One compact strip. It has to stay obviously not-Blinkit — nobody should
    // mistake simulated engagement history for the real app — but it shouldn't
    // eat a third of a phone screen either.
    <div className="border-b border-dashed border-[#c9a227] bg-[#fffbe6] px-2 py-1">
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 rounded bg-[#c9a227] px-1 py-px text-[8px] font-bold tracking-wide text-white uppercase">
          Demo
        </span>
        <label htmlFor="demo-customer" className="sr-only">
          Viewing as
        </label>
        <select
          id="demo-customer"
          value={current}
          onChange={(e) => choose(e.target.value)}
          className="min-w-0 flex-1 rounded border border-[#e0cd80] bg-white px-1.5 py-0.5 text-[10px]"
        >
          {sampleCustomers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.label} · {isMAC(c) ? "MAC" : "not MAC"}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={reset}
          title="Clear demo purchases and pinned categories"
          className="shrink-0 rounded border border-[#e0cd80] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#7a6414]"
        >
          Reset
        </button>
      </div>
      {customer && (
        <p className="truncate text-[9px] leading-snug text-[#7a6414]">
          {customer.note}{" "}
          <span className="opacity-70">
            MAC = ordered in the last 30 days, the feature's whole target group. Simulated data.
          </span>
        </p>
      )}
    </div>
  );
}
