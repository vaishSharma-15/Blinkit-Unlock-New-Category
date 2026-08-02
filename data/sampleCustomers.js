/**
 * ⚠️ SAMPLE DATA — stands in for a real Blinkit backend.
 *
 * We have no access to Blinkit's real search history, browse history, or order
 * history, so every profile below is illustrative. The product reviews and the
 * AI output generated from them are real; this file is not. That split is
 * deliberate and the filename says so on purpose.
 *
 * Shape:
 *   lastOrderDaysAgo — drives the Monthly Active Customer check
 *   engaged          — categories searched or browsed, with recency
 *   purchased        — categories already bought from (disqualifies them)
 */
export const sampleCustomers = [
  {
    id: "c1",
    name: "Priya",
    label: "Interested in 1 new category",
    note: "Searched pet care once, never bought outside groceries.",
    lastOrderDaysAgo: 4,
    engaged: [{ category: "pet-care", daysAgo: 3, type: "search" }],
    purchased: ["grocery", "snacks"],
  },
  {
    id: "c2",
    name: "Arjun",
    label: "Interested in 3 new categories",
    note: "Searched pet care and stationery, browsed electronics — three new categories.",
    lastOrderDaysAgo: 2,
    engaged: [
      { category: "pet-care", daysAgo: 1, type: "search" },
      { category: "electronics", daysAgo: 1, type: "browse" },
      { category: "stationery", daysAgo: 2, type: "search" },
    ],
    purchased: ["grocery"],
  },
  {
    id: "c3",
    name: "Meera",
    label: "No interest shown yet",
    note: "Never looked outside groceries. Should see no feature at all.",
    lastOrderDaysAgo: 5,
    engaged: [],
    purchased: ["grocery", "household"],
  },
  {
    id: "c4",
    name: "Rohan",
    label: "Interested, but inactive 62 days",
    note: "Strong pet-care signal, but last order was 62 days ago.",
    lastOrderDaysAgo: 62,
    engaged: [{ category: "pet-care", daysAgo: 5, type: "search" }],
    purchased: ["grocery"],
  },
  {
    id: "c5",
    name: "Sana",
    label: "Old interest, or already bought it",
    note: "Skincare signal is 5 months old; already buys stationery.",
    lastOrderDaysAgo: 8,
    engaged: [
      { category: "skincare", daysAgo: 150, type: "browse" },
      { category: "stationery", daysAgo: 4, type: "search" },
    ],
    purchased: ["grocery", "stationery"],
  },
];

export const DEFAULT_CUSTOMER_ID = "c2";

export function getSampleCustomer(id) {
  return (
    sampleCustomers.find((c) => c.id === id) ??
    sampleCustomers.find((c) => c.id === DEFAULT_CUSTOMER_ID)
  );
}
