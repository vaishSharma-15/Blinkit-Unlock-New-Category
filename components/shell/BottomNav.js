import Link from "next/link";

/**
 * Blinkit's bottom bar: a floating white pill that hovers over the content
 * rather than a full-width bar welded to the bottom edge. The active tab is a
 * filled rounded rectangle behind the icon, not an underline.
 *
 * Four tabs, in the app's order: Home, Order Again, Categories, Print.
 */
export default function BottomNav({ active = "home" }) {
  const items = [
    { id: "home", label: "Home", href: "/", icon: HomeIcon },
    { id: "reorder", label: "Order Again", href: "/", icon: BagIcon },
    { id: "categories", label: "Categories", href: "/categories", icon: DotsIcon },
    { id: "print", label: "Print", href: "/", icon: PrintIcon },
  ];

  return (
    <nav
      aria-label="Main"
      className="pointer-events-none sticky bottom-0 z-20 px-3 pt-2 pb-3"
    >
      <ul className="pointer-events-auto flex items-center justify-between rounded-full bg-white px-2 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.14)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center gap-0.5"
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full ${
                    isActive ? "bg-[#f1f1f3]" : ""
                  }`}
                >
                  <Icon />
                </span>
                <span
                  className={`text-[11px] leading-none ${
                    isActive ? "font-bold" : "font-medium text-black/70"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const svg = (children) => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const HomeIcon = () =>
  svg(
    <>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M9.5 21v-5.5h5V21" />
    </>,
  );
const BagIcon = () =>
  svg(
    <>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>,
  );
const DotsIcon = () =>
  svg(
    <>
      <circle cx="8.5" cy="8.5" r="2.6" />
      <circle cx="15.5" cy="8.5" r="2.6" />
      <circle cx="8.5" cy="15.5" r="2.6" />
      <circle cx="15.5" cy="15.5" r="2.6" />
    </>,
  );
const PrintIcon = () =>
  svg(
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7" rx="2" />
      <rect x="7" y="16" width="10" height="5" rx="1" />
    </>,
  );
