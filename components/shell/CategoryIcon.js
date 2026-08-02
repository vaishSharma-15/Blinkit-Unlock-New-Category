/**
 * One consistent SVG icon per real catalogue category — grocery, snacks,
 * household, pet-care, skincare, stationery.
 *
 * Replaces the emoji glyphs (🥬🍪🧴🐾🧖✏️) that used to stand in for these
 * everywhere: category tiles, the search-bar nudge chip, the still-curious
 * row, the post-purchase prompt, and — via `fallbackForProduct` below — any
 * product photo that hasn't been sourced yet. Same thin-stroke, rounded
 * style already established in CategoryTabs.js, so a customer sees one
 * consistent icon language rather than emoji in some places and line icons
 * in others.
 */
const ICONS = {
  grocery: GroceryIcon,
  snacks: SnacksIcon,
  household: HouseholdIcon,
  "pet-care": PetCareIcon,
  skincare: SkincareIcon,
  stationery: StationeryIcon,
  kitchenware: KitchenwareIcon,
  pharmacy: PharmacyIcon,
  garden: GardenIcon,
  electronics: ElectronicsIcon,
};

export default function CategoryIcon({ slug, size = 22, className = "" }) {
  const Icon = ICONS[slug];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}

const shell = (size, className, children) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

function GroceryIcon({ size, className }) {
  return shell(
    size,
    className,
    <>
      <path d="M4 4h2l1.2 11.6a2 2 0 0 0 2 1.8h8a2 2 0 0 0 2-1.8L20 8H7" />
      <circle cx="10" cy="20.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20.5" r="1.3" fill="currentColor" stroke="none" />
    </>,
  );
}

function SnacksIcon({ size, className }) {
  // A cookie: a plain circle with a few filled chip dots. Deliberately the
  // simplest possible geometry — the previous attempt at a popcorn-bucket
  // outline rendered as an unrelated trash-can silhouette, a reminder that a
  // shape only "reads" correctly if it's simple enough to survive chip size.
  return shell(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>,
  );
}

function HouseholdIcon({ size, className }) {
  return shell(
    size,
    className,
    <>
      <path d="M8 3.5v3M12.5 3.5v3" />
      <rect x="6" y="6.5" width="9" height="14" rx="2" />
      <path d="M6 11h9" />
    </>,
  );
}

function PetCareIcon({ size, className }) {
  // A paw print: four small toe pads fanned above one larger palm pad, filled
  // rather than outlined so it stays legible at chip size instead of blurring
  // into a blob the way four overlapping stroked circles did.
  return shell(
    size,
    className,
    <>
      <ellipse cx="12" cy="16" rx="4.2" ry="3.4" fill="currentColor" stroke="none" />
      <ellipse cx="6.6" cy="11.2" rx="1.7" ry="2.1" fill="currentColor" stroke="none" />
      <ellipse cx="10.4" cy="8.3" rx="1.7" ry="2.1" fill="currentColor" stroke="none" />
      <ellipse cx="13.6" cy="8.3" rx="1.7" ry="2.1" fill="currentColor" stroke="none" />
      <ellipse cx="17.4" cy="11.2" rx="1.7" ry="2.1" fill="currentColor" stroke="none" />
    </>,
  );
}

function SkincareIcon({ size, className }) {
  return shell(
    size,
    className,
    <>
      <rect x="8" y="8.5" width="8" height="12" rx="2.5" />
      <path d="M10 8.5V5a2 2 0 0 1 4 0v3.5" />
      <path d="M8 13h8" />
    </>,
  );
}

function StationeryIcon({ size, className }) {
  return shell(
    size,
    className,
    <>
      <path d="M6 20 16.5 9.5l-2-2L4 18l-1 3z" />
      <path d="M14.5 7.5l2 2" />
    </>,
  );
}

function KitchenwareIcon({ size, className }) {
  return shell(
    size,
    className,
    <>
      <path d="M5 19 17 7" />
      <path d="M14 4l6 6-3 3-6-6z" />
    </>,
  );
}

function PharmacyIcon({ size, className }) {
  // A cross in a rounded tile — the universal pharmacy mark, not a pill
  // capsule (which reads too close to the household/skincare bottle icons
  // at this size).
  return shell(
    size,
    className,
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>,
  );
}

function GardenIcon({ size, className }) {
  // A simple sprout: stem plus two curled leaves, filled so it stays legible
  // at chip size — the same reasoning as PetCareIcon's filled paw.
  return shell(
    size,
    className,
    <>
      <path d="M12 20V11" />
      <path d="M12 11C12 7 9 6 6 6c0 3.5 2.5 5.5 6 5.5z" fill="currentColor" stroke="none" />
      <path d="M12 11c0-3.5 2.5-5 5.5-5 0 3.2-2 5-5.5 5z" fill="currentColor" stroke="none" />
    </>,
  );
}

function ElectronicsIcon({ size, className }) {
  return shell(
    size,
    className,
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.5" y="14" width="4.5" height="6" rx="2" />
      <rect x="17" y="14" width="4.5" height="6" rx="2" />
    </>,
  );
}

/**
 * The fallback for a product with no real photo yet: the category's own
 * icon, muted, on a soft tinted tile — a placeholder that reads as
 * intentional, not a decorative emoji standing in for a missing asset.
 */
export function ProductPhotoFallback({ category, size = 36 }) {
  return (
    <div className="flex h-full w-full items-center justify-center text-black/25">
      <CategoryIcon slug={category} size={size} />
    </div>
  );
}
