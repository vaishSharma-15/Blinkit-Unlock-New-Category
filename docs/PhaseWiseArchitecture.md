# Unlock New Category — Phase-Wise Architecture

Companion to [ProblemStatement.md](ProblemStatement.md). This document describes **how** to build what that document specifies, in the order it should be built.

Each phase is independently shippable and independently demoable. Do not start a phase before the one above it works.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js App (Vercel)                                        │
│                                                              │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Blinkit Shell  │  │ Personalised     │  │ Unlock New   │  │
│  │ header / tabs  │  │ search-bar nudge │  │ Category card│  │
│  │ product grid   │  │ (sparkle cue)    │  │              │  │
│  └────────────────┘  └────────┬─────────┘  └──────┬───────┘  │
│                               │                   │          │
│  ┌────────────────────────────▼───────────────────▼───────┐  │
│  │  Eligibility Engine  (pure functions, NOT AI)          │  │
│  │  engaged categories − purchased categories = eligible  │  │
│  └────────────────────────────┬───────────────────────────┘  │
│                               │                              │
│  ┌────────────────────────────▼───────────────────────────┐  │
│  │  API Routes                                            │  │
│  │  /api/summary   → AI review summary + quality claim    │  │
│  │  /api/ask       → AI answer grounded in review text    │  │
│  └────────────────────────────┬───────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────┘
                                │
      ┌─────────────────────────▼──────────────────────┐
      │  Data Layer                                    │
      │                                                │
      │  reviews.json      REAL product review text    │
      │  products.json     REAL product catalogue      │
      │  sampleCustomers.js  SIMULATED — clearly named │
      └────────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Gemini API           │
                    │  (gemini-3.6-flash)   │
                    └───────────────────────┘
```

**The single most important architectural rule:** real data and simulated data never live in the same file. Product reviews and products are real. Customer engagement history is simulated and must be in a file whose name says so.

---

## Phase 0 — Project Setup

**Goal:** an empty Next.js app deployed to Vercel.

| Item | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| AI | Gemini API via `@google/genai`, model `gemini-3.6-flash` (free tier) |
| Data | Flat JSON files in `/data` — no database needed at this scale |

**Directory shape:**

```
/app
  /page.js                    home screen (shell + nudge)
  /category/[slug]/page.js    category page (shell + Unlock card)
  /api/summary/route.js
  /api/ask/route.js
/components
  /shell/                     Header, SearchBar, CategoryTabs, ProductGrid
  /unlock/                    UnlockCard, AskBox, StillCuriousRow, PostPurchase
/lib
  eligibility.js              pure logic, no AI
  reviews.js                  read + filter review data
  ai.js                       single wrapper around the Gemini API
/data
  reviews.json                REAL
  products.json               REAL
  sampleCustomers.js          SIMULATED — name says so
```

**Done when:** a blank page is live on a Vercel URL.

---

## Phase 1 — The Blinkit Shell

**Goal:** the app looks like Blinkit before any new feature exists.

Build, in order:
1. Yellow header with delivery time ("Delivery in 10 minutes") and address line
2. Search bar with generic rotating placeholder text ("Search stationery", "Search milk", …)
3. Horizontal row of category tabs
4. Product card grid matching Blinkit's card style (image, name, weight, price, ADD button)

Everything reads from `products.json`. No personalisation yet — this is the control state, the version a customer with no signal sees.

**Done when:** a stranger looking at the screen would guess it's Blinkit.

---

## Phase 2 — Data Layer

**Goal:** real review data and clearly-labelled sample customer data exist and are queryable.

### `reviews.json` — REAL
```json
{
  "product_id": "pet-001",
  "product_name": "Pedigree Chicken & Milk Dog Treats 100g",
  "category": "pet-care",
  "reviews": [
    { "rating": 4, "text": "Dog loves these. Packaging is a bit flimsy though." }
  ]
}
```
Modest coverage is fine — a handful of products across 3–4 non-grocery categories. The requirement is that the text is **real**, not that the catalogue is complete.

### `sampleCustomers.js` — SIMULATED
```js
// SAMPLE DATA — stands in for a real Blinkit backend.
// Engagement and purchase history here is illustrative, not real.
export const sampleCustomers = [
  {
    id: "c1", name: "Single-signal customer",
    lastOrderDaysAgo: 4,
    engaged:   [{ category: "pet-care", daysAgo: 3, type: "search" }],
    purchased: ["grocery", "snacks"]
  },
  {
    id: "c2", name: "Multi-signal customer",     // REQUIRED by spec
    lastOrderDaysAgo: 2,
    engaged: [
      { category: "pet-care", daysAgo: 1, type: "search" },
      { category: "skincare", daysAgo: 1, type: "browse" }
    ],
    purchased: ["grocery"]
  },
  {
    id: "c3", name: "No-signal customer",        // REQUIRED by spec
    lastOrderDaysAgo: 5,
    engaged: [],
    purchased: ["grocery", "household"]
  }
]
```

Add a **customer selector** in the demo UI — a small dropdown that switches which sample customer you're viewing as. This is the only way to demo all three states.

**Done when:** switching customers in the selector visibly changes nothing yet, but the data is wired and inspectable.

---

## Phase 3 — Eligibility Engine (not AI)

**Goal:** given a customer, return their eligible categories in the right order.

`lib/eligibility.js` — pure functions, no network, no AI, fully unit-testable:

```js
isMAC(customer)                  // ordered within last 30 days
getEligible(customer)            // engaged categories − purchased categories
rankEligible(categories)         // recency first; complaint-volume tie-break
                                 //   ONLY when UI forces a single slot
```

Rules encoded here, straight from the spec:
- Not a MAC → empty list, feature never shows
- No eligible categories → empty list, no fallback, no generic suggestions
- Multiple eligible → **return all of them.** Cutting to one is a UI-space decision made by the component, not by this engine.
- Never reference any other customer's data

**Done when:** unit tests pass for all three sample customers, including the multi-category case returning two entries.

---

## Phase 4 — The Nudge

**Goal:** eligible customers see a personalised, always-visible cue in the
search bar.

- Render each eligible category as a **persistent sparkle chip** pinned to the
  right of the search field: "✨ Dog treats"
- The chip carries the full sentence — "Wanna continue your last search — dog
  treats?" — as its accessible label and hover title
- The sparkle appears on **personalised entries only**; the generic rotating
  placeholder beside it stays plain
- Multiple eligible categories → the chip cycles through all of them, so every
  signal surfaces and none is picked as the winner
- Empty eligibility list → **no chip at all**, and the placeholder is exactly
  the plain Phase 1 generic list. No fallback, no generic stand-in
- Tapping the chip routes to that category page

**Done when:** customer c2 sees a sparkle chip on screen continuously, cycling
through all their eligible categories, and c3 sees no chip anywhere.

### Why a chip and not a rotating placeholder

This phase was first built the way it was originally specified — personalised
entries folded into the rotating placeholder list. It worked, and it was wrong,
in a way only visible in the hand: a nudge inside a rotation is on screen about
a third of the time, and the entry is the **only route into the category**, so
looking away for a few seconds meant losing the way in.

Fixes within the rotation helped and did not solve it. Spreading the entries
evenly and letting them dwell longer cut the worst gap from 14s to 6s and
raised visibility from 37% to 62% — better, still missable.

Keeping both was measured and rejected. On a 390px phone the chip leaves the
placeholder 212px; the sentence above needs 302px, so the spec-literal version
would arrive truncated mid-word.

The chip keeps every guarantee the original list made — sparkle only where
earned, all eligible categories surfaced, nothing at all without a signal,
tap-to-route — and drops the one property that was costing us the phase: that
the nudge disappears.

---

## Phase 5 — AI Summary

**Goal:** the Unlock New Category card renders with a real, grounded review summary.

**Data source:** Blinkit's own order history — reorder rate and return rate per
product — which exists automatically at high volume for every product sold.
Real review text from the earlier phase's corpus is folded in as secondary
colour where it exists. Nothing is pulled from Amazon, Flipkart, or any other
outside platform.

Computing the rates is plain arithmetic, not AI. The AI step is turning those
numbers plus any review text into one short, honest sentence.

**`/api/summary`** — input `product_id`, output:
```json
{
  "eligible": true,
  "summary": "Owners consistently say their dogs take to these...",
  "qualityClaimSupported": true,
  "qualityLine": "Reviews say the quality holds up."
}
```

Server-side flow:
1. Load that product's order stats and any category review text
2. **Gate first:** if order volume < threshold, return `{ eligible: false }` and make no AI call. Card does not render at all — summary, ask box, and closing line disappear together
3. Otherwise send the real review text to the model with a prompt that requires: plain language, both praise and common complaints, nothing beyond what the reviews say
4. Ask the model to separately report whether the evidence genuinely supports a quality claim. If not, `qualityLine` is omitted and the closing line renders with the delivery half only
5. Distinguish **product** faults from **delivery** problems. Transit damage says nothing about whether the product is good and must not by itself block a quality claim
6. When the numbers and the review text disagree, report both and suppress the quality claim

Card assembly on the client:
- Summary (AI)
- Closing line = `qualityLine` (AI, conditional) + fixed delivery text (never AI, never names a competitor)
- Guarantee line (fixed text, always)

**Caching:** a short in-memory window per product (3 minutes) so idle clicking
can't exhaust the API quota. The Regenerate button bypasses it entirely, so
that button is always a genuine live call. Nothing AI-generated is ever
persisted to disk or committed.

**Provably live.** The demo must show the AI is generating, not replaying:
free-text ask box (any question, real call each time), visible loading states,
raw figures rendered beside the generated sentence so the two can be compared,
and a Regenerate control that produces fresh wording from the same facts.

**Done when:** the card shows a real summary on a product with reviews, and does not render at all on a product below the threshold.

---

## Phase 6 — Ask About This

**Goal:** customers can ask free-text questions and get grounded answers.

**`/api/ask`** — input `product_id` + `question`, output an answer plus the review snippets it drew from.

Server-side flow:
1. Retrieve the most relevant reviews for that product for this question
2. Send them to the model with a strict instruction: answer **only** from this review text; if the reviews don't cover it, say so plainly rather than guessing
3. Return the answer with its supporting snippets so the grounding is visible

Guardrails: rate-limit per session, cap question length, and treat "the reviews don't mention this" as a correct and expected answer — not a failure.

**Done when:** a question the reviews cover gets a specific answer, and a question they don't cover gets an honest "reviews don't mention that."

---

## Phase 7 — Multi-Category and Post-Purchase

**Goal:** close the loop toward *repeated monthly* exploration.

**"Still curious about" row** — renders below the card when the customer has a second eligible category. Links to the same experience for that category. Sourced only from that customer's own engagement.

**Post-purchase pairing** — after a purchase through this feature, render both together:
1. "Add to your frequent categories" button — customer-initiated, never automatic
2. Forward-looking prompt drawn from remaining eligible categories: "Since you're on a roll, want to check out Skincare too?"

If no eligible categories remain, show the button alone with a neutral confirmation — never a generated or generic category suggestion.

**Done when:** c2 can go pet care → purchase → prompted toward skincare, in one unbroken click-through.

---

## Phase 8 — Polish and Ship

- Loading states for both AI calls (summary and ask) — never a blank card
- Failure states: if the AI call errors, hide the card rather than render an empty one
- Mobile-first sizing — this is a phone app
- Deploy to a live Vercel URL
- Confirm all three sample customers behave correctly on the deployed build

---

## Build Order Summary

| Phase | Deliverable | AI? |
|---|---|---|
| 0 | Next.js on Vercel | — |
| 1 | Blinkit shell | — |
| 2 | Real reviews + labelled sample customers | — |
| 3 | Eligibility engine | No |
| 4 | Personalised search-bar nudge | No |
| 5 | AI review summary + card gating | Yes |
| 6 | Ask-about-this box | Yes |
| 7 | Still-curious row + post-purchase pairing | No |
| 8 | Polish and deploy | — |
