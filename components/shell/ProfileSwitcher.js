"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { sampleCustomers } from "@/data/sampleCustomers";
import { writeCookie } from "@/lib/clientCookie";
import { isMAC } from "@/lib/eligibility";
import { FREQUENT_COOKIE, PURCHASED_COOKIE, SEARCHED_COOKIE } from "@/lib/demoSession";

/**
 * Demo-only control for switching which sample customer you're viewing as —
 * folded into the header's own "Account" circle rather than a permanent bar
 * across the top of every page. The circle shows the current sample
 * customer's initial so it still answers "whose screen is this," just without
 * costing a whole strip of chrome to say so.
 *
 * Everything the old always-visible bar did — pick a customer, see their
 * simulated note, reset the demo session — lives in the panel this opens.
 * The "Demo" label and the simulated-data note move here too, so the one
 * place this control lives still can't be mistaken for a real account menu.
 */
export default function ProfileSwitcher({ current }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(id) {
    writeCookie("demoCustomer", id);
    setOpen(false);
    router.refresh();
  }

  /**
   * Clears everything this demo session has recorded — purchases, pins, and
   * live searches — so any customer can be walked through again from a clean
   * slate. Sample history itself is in the data file and is never touched.
   */
  function reset() {
    for (const name of [PURCHASED_COOKIE, FREQUENT_COOKIE, SEARCHED_COOKIE]) {
      writeCookie(name, "", { maxAge: 0 });
    }
    setOpen(false);
    router.refresh();
  }

  const customer = sampleCustomers.find((c) => c.id === current);
  const initial = customer?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Switch demo customer"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[14px] font-bold text-blinkit-green"
      >
        {initial}
        <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-[#c9a227] px-1 py-px text-[6px] font-bold tracking-wide text-white uppercase">
          Demo
        </span>
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-30 w-72 max-w-[85vw] rounded-xl border border-border bg-white p-2.5 text-left shadow-lg">
          <p className="px-1 text-[10px] font-semibold tracking-wide text-muted uppercase">
            Viewing as — simulated data
          </p>
          <ul className="mt-1.5 space-y-1">
            {sampleCustomers.map((c) => {
              const active = c.id === current;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => choose(c.id)}
                    className={`flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left ${
                      active ? "bg-blinkit-green/10" : "hover:bg-[#f7f7f8]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
                      {c.name}
                      {active && (
                        <span className="text-[9px] font-bold text-blinkit-green">
                          · viewing
                        </span>
                      )}
                    </span>
                    <span className="text-[10.5px] text-muted">
                      {c.label} · {isMAC(c) ? "MAC" : "not MAC"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {customer && (
            <p className="mt-2 border-t border-border px-1 pt-2 text-[10px] leading-snug text-muted">
              {customer.note}
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            title="Clear demo purchases and pinned categories"
            className="mt-2 w-full rounded-lg border border-border px-2 py-1.5 text-[11px] font-semibold text-muted"
          >
            Reset this demo session
          </button>
        </div>
      )}
    </div>
  );
}
