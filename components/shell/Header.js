import ProfileSwitcher from "./ProfileSwitcher";

/**
 * Blinkit's yellow header, matched to the live app.
 *
 * Order top to bottom, because the positions are the recognisable part:
 *   "Blinkit in" · big delivery time · 24/7 pill · wallet + profile circles
 *   ADDRESS LABEL — flat number, with a dropdown caret
 *
 * The search bar and the tab strip sit under this inside the same yellow
 * block; they're separate components but share the background.
 *
 * The "Account" circle doubles as the demo customer switcher — see
 * ProfileSwitcher — instead of a separate always-visible bar above the app
 * chrome. `customerId` is passed through for that purpose only.
 */
export default function Header({ customerName, customerId }) {
  return (
    <header className="bg-blinkit-yellow px-4 pt-3 pb-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] leading-none font-bold">Blinkit in</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-[30px] leading-none font-extrabold tracking-tight">
              14 minutes
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold">
              <ClockIcon />
              24/7
            </span>
          </div>
          {/* Saved address, named for whichever sample customer is selected —
              so the header says out loud whose screen you are looking at. The
              names are from data/sampleCustomers.js and are invented; the real
              customer name in the screenshot this shell was matched to is not
              ours to reproduce. */}
          <button
            type="button"
            className="mt-1.5 flex max-w-full items-center gap-1 text-[14px] font-bold"
          >
            <span className="truncate">
              {customerName ? `${customerName} — ` : ""}Sector 21, Gurugram
            </span>
            <ChevronDown />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Wallet"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <WalletIcon />
          </button>
          <ProfileSwitcher current={customerId} />
        </div>
      </div>
    </header>
  );
}

function ClockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="6" width="19" height="13" rx="3" fill="#0c831f" />
      <path d="M2.5 9.5h19" stroke="#fff" strokeWidth="1.2" opacity=".5" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="700"
        fill="#fff"
      >
        ₹
      </text>
    </svg>
  );
}

