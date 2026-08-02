# Unlock New Category — Problem Statement and Build Spec

## 1. The Problem

Blinkit has a large base of Monthly Active Customers (MACs) who order groceries almost every week. Most of them buy from the same two or three categories forever — groceries, snacks, household essentials — and never buy anything else, even though the app already sells it.

We looked into why, using three sources:

- 41,176 public reviews, analysed with an AI pipeline
- a 40-person survey
- 6 user interviews

All three said the same thing:

> People do think about trying a new category on Blinkit. They search for it. They look at it. Then they don't buy it — because they aren't sure the quality is good, and they don't know if they can return it if it's wrong.

This is **not** a confusion problem. Users know how the app works, and they know Blinkit sells more than groceries. It is a **trust** problem. They don't trust an unfamiliar category enough to risk the money, so they buy it on Amazon or Flipkart instead, where they can read reviews first.

## 2. Who This Is For

We call them **On-the-Fence Loyalists**.

They are customers who:

- already order from Blinkit regularly
- are loyal for groceries
- have searched for or browsed something outside groceries at least once
- have never actually bought outside their usual categories

They are **65% of our surveyed users**.

What they told us in interviews:

| Quote | What it means |
|---|---|
| "I trust Flipkart more than Blinkit in terms of quality." | Said by a user who skipped buying earbuds on Blinkit. |
| "No guarantee for quality." | This user only buys packaged items he doesn't need to inspect. |
| "A reviews section like Amazon — it helps to build trust." | A user asking for exactly this feature. |
| "I really loved the quality." | The same user, after finally trying a new category once. Once they try it and it's good, they come back. |

## 3. Our Goal

**Increase the share of Monthly Active Customers who buy from at least one new category each month.**

This is Blinkit's own stated growth strategy. More categories per user means bigger baskets, better margins, and stronger loyalty.

One important detail: **this goal is measured every month.** A customer who converts once and never explores again only helps the month they converted. That single fact shapes several design decisions later in this document, so keep it in mind.

## 4. The Feature: Unlock New Category

**In one sentence:** when an existing customer has shown interest in a category they've never bought from — by searching for it or browsing it — Blinkit shows them a personalised nudge, and once they land on that category, gives them a real AI-written product summary, a way to ask questions about the product, and a return guarantee — all right where they already are, with no extra searching.

### 4.1 Why the feature has this shape

Two findings from the survey drove the design:

1. **70% of users only search for something specific. Only 23% ever browse to discover new things.** So if we wait for people to stumble onto a new category, most never will. The feature has to actively reach them.
2. **The reason people hesitate splits roughly evenly between "I don't trust the quality" and "I'll waste my money if it's wrong."** So the feature has to answer *both* worries together — not just one.

### 4.2 Who sees it

Only **existing Monthly Active Customers** — customers who have ordered from Blinkit recently (for example, within the last 30 days).

This matches the company goal exactly: we're trying to move the share of MACs who explore, not attract new users. **This feature is not for new-user acquisition.**

### 4.3 How the app decides what to show

**Step 1 — Find eligible categories.**
Look at what the customer searched for or browsed in the last few months. If they engaged with a category (by search or browse) but never placed an order in it, that category is **eligible**.

**Step 2 — If more than one category is eligible, don't force a single winner.**
Example: a customer searched both pet care and skincare within a day or two. Show both — either as two nudge entries that both appear, or rotating across app opens.

Only cut down to one entry if the UI genuinely runs out of space. If you must cut down to one, pick the category where trust is easier to earn (based on how much quality-complaint volume it has). This is a **tie-breaker rule, not the default behaviour.**

**Step 3 — No fallback list. Ever.**
If a customer has never engaged with anything outside groceries, they simply don't see this feature. This is deliberate. A customer with no exploration signal has a different problem — *awareness*, not *trust* — and this feature is not built to solve that.

### 4.4 Where it appears in the app

#### A. The nudge — in the search bar

Blinkit's home screen already has a search bar with rotating placeholder text (e.g. "Search stationery"). For an eligible customer, that rotation includes one or more **personalised** entries pulled from their real engagement history:

> "Wanna continue your last search — dog treats?"

Add a small, consistent visual cue (e.g. a sparkle icon) next to personalised suggestions **only**, so they're visually distinct from the generic suggestions everyone else sees.

#### B. The category page — once they tap in

Whether they arrive through the nudge or by tapping a category tab themselves, the category page shows a card near the top, above the product listings, titled **"Unlock New Category"**. It contains four things:

**1. An AI-written review summary.**
A real summary of that specific product's reviews, in plain language, honestly covering both the praise and the common complaints. Generated from our own product-level review database (see section 6).

**2. An "Ask about this" box.**
The customer types any question — for example, "does the packaging keep it fresh?" — and gets a live answer generated from that product's real review text. Same retrieval-and-generation approach used elsewhere in this project, just exposed directly to the customer this time.

**3. A closing line that turns proof into a reason to buy now.**
The quality half is AI-generated, and only appears if the real reviews genuinely support it. The delivery half is fixed text about Blinkit. Together it reads something like:

> "Reviews say the quality holds up. Get it at your door in 10 minutes instead of waiting 2–3 days elsewhere."

**Never name or compare against a specific competitor.** Only reference Blinkit's own delivery speed as the reason to act now. Never invent a quality claim the reviews don't support.

**4. A guarantee line (fixed text).**

> "First time in this category? Free return within 24 hours, no questions asked."

#### Show the card only when there's enough real data

Set a minimum review count (for example, at least a small handful of real reviews). Below that, **the card should not appear at all.**

A thin, generic summary built from too little data is worse than showing nothing — it signals uncertainty instead of confidence. This rule applies to the summary, the ask box, and the closing line **together**: if there isn't enough data to support them honestly, hide the whole card.

#### The "still curious" row

If the same customer has more than one eligible category, show a small row underneath — e.g. "Still curious about — Skincare" — linking to the same experience for that category.

This row must **only** surface categories the customer engaged with themselves. Never a suggestion generated by comparing them to other customers. We tested that approach in our research and it does not reliably work for this problem.

### 4.5 What happens after they buy

Once a customer buys a product surfaced through this feature, show **two things side by side**:

1. **A button: "Add to your frequent categories."** Optional and customer-initiated. Never automatic.
2. **A forward-looking prompt**, built from their own remaining eligible categories: "Since you're on a roll, want to check out Skincare too?"

**Why the pairing matters:** our goal is measured every month. A customer who converts once and stops doesn't help future months. Pairing the button with a forward-looking prompt turns one successful conversion into momentum toward the next one, instead of a stopping point. **Do not build the button alone without this pairing.**

## 5. What Is AI, and What Is Simple Logic

Build both correctly. Don't make something AI if it doesn't need to be.

| Component | AI or not? | Notes |
|---|---|---|
| Deciding which categories are eligible for a customer | **Not AI** | Simple lookup: engagement history minus purchase history. |
| Deciding which eligible category/categories to show | **Not AI** | Simple rule, per section 4.3. |
| Product review summary on the category page | **AI** | Generated from real review text in our product-level review database. |
| "Ask about this" answer box | **AI** | Live answer from real review text for that specific product, grounded in what the reviews actually say. Never invent unsupported claims. |
| Guarantee line | **Not AI** | Fixed text. |
| Closing line — quality half | **AI** | Generated with the summary from the same review text. Only claims quality when reviews support it. |
| Closing line — delivery half | **Not AI** | Fixed text about Blinkit. Never names or compares a competitor. |
| Show/hide the whole card based on review volume | **Not AI** | Simple rule: minimum review count. |
| "Add to frequent categories" button + forward-looking prompt | **Not AI** | Simple logic. The prompt pulls from the customer's own real eligible categories, not a generated suggestion. |

## 6. Our Own Product-Level Review Database

An earlier phase of this project analysed reviews about the Blinkit **app and shopping experience** in general. This feature needs something different: real reviews about **actual products**, so the AI can honestly answer questions about a specific item, not just its category.

Build a small database of real product reviews, structured so each review is linked to a specific product and category.

It can be modest to start. It does **not** need to cover Blinkit's full catalogue. It needs to be real enough that the AI summaries and answers are genuinely grounded in real text, not invented.

## 7. Testing Without Real Blinkit User Data

We don't have access to Blinkit's backend, real customer search history, real order history, or the real product catalogue. Two kinds of data need two different kinds of handling.

**Real data — the product reviews.**
The reviews, and the AI summaries and answers generated from them, can and should be tested with real data using the review database above. This part should genuinely work end to end with real content.

**Simulated data — the engagement signal.**
The "engaged but never purchased" signal has to be simulated, and clearly labelled as such. Build a small set of realistic sample customer profiles to demonstrate the logic. Include at minimum:

- one profile with **two categories engaged close together in time** (e.g. searched pet care and skincare on the same day), so the demo shows multiple eligible categories appearing together
- one profile with **no engagement outside groceries**, who should correctly see no version of this feature at all

For the demo, add a simple selector that lets you pick which sample customer you're viewing as. That's the clearest way to show the whole flow working, including the multi-category case.

Keep the sample customer data in **its own clearly named file**, separate from the main logic — so it's obvious which parts are real (product reviews, AI outputs) and which parts are illustrative sample data standing in for a real backend (customer engagement histories).

## 8. What Not to Build

- ❌ **No real-time behaviour tracking.** Working off search and browse history already stored in the system is fine.
- ❌ **No recommendation system based on similarity to other customers.** We tested this directly in our research and it does not reliably work for this problem. Use only what the specific customer has done themselves — both for which categories to show and for the "still curious about" row.
- ❌ **No push notifications or any external alerts.** The feature appears inside the app only, when the customer opens it themselves.
- ❌ **No live data, ratings, or reviews pulled from competitor sites** (Amazon, Zepto, etc.). It's unreliable, likely against those platforms' terms of use, and we can't guarantee accurate product matching across platforms. The closing line must rely only on our own review data and our own delivery speed.
- ❌ **Not for brand-new users with no order history.** Existing regular customers only.
- ❌ **No fallback list of generic suggestions** for customers with no personal signal. No signal, no card.
- ❌ **No automatic adding of a category to someone's frequent list.** The button must be customer-initiated.

## 9. How We'll Know It's Working

**North star metric — Category Exploration Rate:** the percentage of Monthly Active Customers who buy from at least one new category in a month.

This feature exists specifically to move that number **every month**, not just once.

**Secondary signal (once real usage exists):** how often a customer who converts through this feature goes on to explore a *second* new category in a following month. Our goal is repeated monthly exploration, not a single one-time conversion.

## 10. Technical Direction

**Front end:** Next.js, deployed on Vercel — not a data-dashboard-style tool.

The UI should genuinely resemble the real Blinkit app, not a generic prototype, because this needs to demonstrate the feature inside a realistic product experience. Match Blinkit's actual visual language closely:

- the yellow header area showing delivery time
- the search bar with rotating placeholder text near the top
- the row of category tabs directly below it
- product cards in Blinkit's existing visual style

Recreate that real layout as the shell first, then add the new elements inside it — the personalised search bar text, the Unlock New Category card, and the ask box — so the feature is shown **in context**, not in isolation.

**Backend:** a small product-level review database with real review text, structured by product and category, connected to the AI summary and ask features through a simple API call.

**Deployment:** ship to a live Vercel URL so it can be opened and clicked through directly, not just described in slides.
