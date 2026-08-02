/**
 * The store-mode tab strip that sits under the search bar on Blinkit's home
 * screen: icon above label, horizontally scrollable, active tab underlined,
 * a "New" flag on whichever store they're pushing.
 *
 * Chrome, not navigation — these switch storefronts in the real app, and this
 * demo only has the one. They scroll and highlight; they don't route anywhere,
 * because a tab that led nowhere would be worse than a tab that stays put.
 */
const TABS = [
  { id: "all", label: "All", icon: BagsIcon },
  { id: "rakhi", label: "Rakhi", icon: RakhiIcon, flag: "New" },
  { id: "kids", label: "Kids", icon: KidsIcon },
  { id: "electronics", label: "Electronics", icon: HeadphonesIcon },
  { id: "beauty", label: "Beauty", icon: BeautyIcon },
  { id: "pharmacy", label: "Pharmacy", icon: PharmacyIcon },
  { id: "toys", label: "Toys", icon: ToysIcon },
];

export default function CategoryTabs({ active = "all" }) {
  return (
    <nav
      aria-label="Store"
      className="bg-blinkit-yellow [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-1 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <li key={tab.id} className="shrink-0">
              <button
                type="button"
                aria-current={isActive ? "true" : undefined}
                className={`relative flex w-[74px] flex-col items-center gap-1 pt-2 pb-2 ${
                  isActive ? "opacity-100" : "opacity-75"
                }`}
              >
                {tab.flag && (
                  <span className="absolute top-0.5 right-2 z-10 rounded-full bg-[#e23744] px-1.5 py-[1px] text-[8px] font-bold text-white">
                    {tab.flag}
                  </span>
                )}
                <Icon />
                <span
                  className={`text-[11px] leading-none ${isActive ? "font-bold" : "font-medium"}`}
                >
                  {tab.label}
                </span>
                <span
                  className={`mt-1 h-[3px] w-full rounded-full ${
                    isActive ? "bg-black" : "bg-transparent"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const icon = (children) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

function BagsIcon() {
  return icon(
    <>
      <path d="M4 8h6v13H4z" />
      <path d="M14 11h6v10h-6z" />
      <path d="M5.5 8V5.5h3V8M15.5 11V9h3v2" />
    </>,
  );
}
function RakhiIcon() {
  return icon(
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 8.8V4M12 15.2V20M8.8 12H4M15.2 12H20" />
      <path d="M9.7 9.7 6.5 6.5M14.3 14.3l3.2 3.2M14.3 9.7l3.2-3.2M9.7 14.3l-3.2 3.2" />
    </>,
  );
}
function KidsIcon() {
  return icon(
    <>
      <path d="M9 3h4l-1 5H10z" />
      <path d="M8 8h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z" />
    </>,
  );
}
function HeadphonesIcon() {
  return icon(
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.5" y="14" width="4.5" height="6" rx="2" />
      <rect x="17" y="14" width="4.5" height="6" rx="2" />
    </>,
  );
}
function BeautyIcon() {
  return icon(
    <>
      <rect x="4" y="9" width="6" height="12" rx="1.5" />
      <path d="M5.5 9V5.5h3V9" />
      <path d="M16 21V10l2-6 2 6v11z" />
    </>,
  );
}
function PharmacyIcon() {
  return icon(
    <>
      <rect x="3" y="8" width="18" height="12" rx="3" />
      <path d="M12 11v6M9 14h6" />
    </>,
  );
}
function ToysIcon() {
  return icon(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17M3.5 12h17" />
    </>,
  );
}
