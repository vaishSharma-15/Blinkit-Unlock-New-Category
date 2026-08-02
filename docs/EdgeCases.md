# Unlock New Category — Edge Cases

Companion to [ProblemStatement.md](ProblemStatement.md) and [PhaseWiseArchitecture.md](PhaseWiseArchitecture.md).

Every row states the situation, the required behaviour, and why. **When in doubt, the default is to show nothing.** This feature exists to build trust — a wrong or empty version of it costs more trust than it earns.

---

## 1. Eligibility Edge Cases

| # | Situation | Required behaviour | Why |
|---|---|---|---|
| 1.1 | Customer has no engagement outside groceries | Show no version of this feature. No nudge, no card, no fallback list. | Their problem is awareness, not trust. This feature doesn't solve that. |
| 1.2 | Customer is not a MAC (no recent order) | Feature never shows, even with strong engagement signal. | The goal is moving MAC exploration, not acquisition. |
| 1.3 | Brand-new user, no order history | Feature never shows. | Explicitly out of scope. |
| 1.4 | Customer engaged with a category **and** already bought from it | Not eligible. Excluded. | "New category" means never purchased. |
| 1.5 | Customer engaged with a category months ago and nothing since | Falls outside the lookback window → not eligible. | A stale signal isn't real interest. |
| 1.6 | Three or more eligible categories | Show the top ones by recency, all of them if the UI allows. Do not silently drop to one by default. | Spec: don't force a single winner. |
| 1.7 | Two categories engaged the same day, equally recent | Show both. Only if UI space genuinely forces one, tie-break on lower quality-complaint volume. | Tie-break is a fallback rule, not the default path. |
| 1.8 | Customer engaged with a category that has **no products** in our data | Not eligible. Filter it out before it reaches the nudge. | A nudge leading to an empty page destroys trust. |
| 1.9 | Customer becomes ineligible mid-session (buys the category) | That category drops out of eligibility for subsequent renders. Don't re-nudge them toward it. | It's no longer a new category. |
| 1.10 | Customer dismisses or ignores the nudge repeatedly | Keep it in rotation, but never escalate to a notification or a modal. | No push, no external alerts — in-app only. |

---

## 2. Review Data Edge Cases

| # | Situation | Required behaviour | Why |
|---|---|---|---|
| 2.1 | Product has **less order volume than the threshold** | Hide the entire card — summary, ask box, closing line, all of it. No AI call is made. | A confident sentence built on 30 orders is a false signal. |
| 2.2 | Product has exactly the threshold volume | Show the card. The threshold is inclusive. | Defined once in `sampleOrderStats.js`, not scattered in code. |
| 2.3 | Product has enough reviews but they're all one-line ("good", "nice") | Treat as insufficient. Hide the card. | Count isn't the real test — usable text is. Gate on substance, not just volume. |
| 2.4 | Reviews are overwhelmingly negative | Still show the card. Summarise honestly, including the complaints. Suppress the quality claim in the closing line. | Honesty is the product. A summary that only ever praises is worthless. |
| 2.5 | Reviews are mixed | Show both sides in the summary. Quality claim appears only if reviews genuinely support it. | Spec: reflect praise *and* common complaints. |
| 2.6 | Reviews mention a competitor | Strip it from the generated output. Never name or compare against a competitor. | Hard rule in the spec. |
| 2.7 | Review data file fails to load | Hide the card. Do not render a shell, skeleton, or placeholder text. | Same principle as 2.1. |
| 2.8 | Category has reviews but the specific product doesn't | Gate at the **product** level, not the category level. This product's card doesn't show. | Summaries must be about the item, not the category. |

---

## 3. AI Edge Cases

| # | Situation | Required behaviour | Why |
|---|---|---|---|
| 3.1 | AI API call fails or times out | Hide the card entirely. Do not fall back to generic marketing copy. | Generic copy is exactly the untrustworthy thing we're replacing. |
| 3.2 | AI returns a claim not supported by the reviews | Prompt must forbid this. Return the supporting snippets so grounding is checkable. | The whole feature depends on the output being real. |
| 3.3 | Reviews don't answer the customer's question | Say plainly: "The reviews don't mention that." | An honest non-answer is a correct answer, not a failure. |
| 3.4 | Customer asks something unrelated to the product | Politely redirect to what the reviews cover. Don't answer off-topic questions. | The box is scoped to that product's reviews. |
| 3.5 | Customer asks about price, delivery, or returns | Answer from fixed Blinkit facts if known, otherwise decline. Never generate these from review text. | Delivery and guarantee lines are fixed text, not AI. |
| 3.6 | Prompt-injection attempt inside review text or a question | Treat review text and user questions as data, never as instructions. | Reviews are third-party content. |
| 3.7 | Empty or whitespace-only question | Don't call the API. Prompt the user for a real question. | Wasted call, meaningless answer. |
| 3.8 | Very long question | Cap the length client-side with a clear character limit. | Cost and latency control. |
| 3.9 | Rapid repeated questions from one session | Rate-limit per session. | Cost control on a public demo URL. |
| 3.10 | Same product viewed repeatedly | Short 3-minute in-memory cache on summaries; Regenerate bypasses it. Never cache an ask answer. | Protects the quota without making the output prewritten. |
| 3.11 | AI reports quality is not supported | Closing line renders with the delivery half only. Never fabricate the quality half. | Only claim quality when the evidence backs it. |
| 3.12 | Order numbers look strong but review text describes product faults | Report both signals in the sentence and suppress the quality claim. | Hiding the tension is the failure this feature exists to avoid. |
| 3.13 | Returns are caused by transit damage, not the product | Does not by itself block a quality claim. Delivery problems are not product-quality problems. | Otherwise the feature can never say anything positive. |
| 3.14 | AI provider returns 429 (quota) | Card shows an explicit "quota reached, try again" state rather than vanishing. | A silently missing card during a live demo looks like a broken feature. |

---

## 4. UI and Flow Edge Cases

| # | Situation | Required behaviour | Why |
|---|---|---|---|
| 4.1 | Customer reaches the category page directly, not via the nudge | Card still shows if they're eligible for that category. | Spec covers both entry paths. |
| 4.2 | Customer reaches a category they've already bought from | No card. It isn't a new category for them. | Eligibility is per-category, always. |
| 4.3 | Summary still loading | Show a loading state inside the card frame. Never a blank card that then vanishes. | Content that appears then disappears reads as broken. |
| 4.4 | Long AI summary overflows the card | Clamp with a "read more" expansion. Never let it push products off-screen. | Products stay the primary content. |
| 4.5 | Only one eligible category | Hide the "still curious about" row entirely. Don't show it empty or padded with generic categories. | No fallback suggestions, ever. |
| 4.6 | Customer buys, and has no remaining eligible categories | Show the "add to frequent categories" button with a neutral confirmation. No invented next suggestion. | Spec forbids generated suggestions. |
| 4.7 | Customer buys, and has one remaining eligible category | Show the button **and** the forward-looking prompt together. | The pairing is required, not optional. |
| 4.8 | Customer ignores "add to frequent categories" | Nothing happens. Never auto-add. | Must be customer-initiated. |
| 4.9 | Sparkle icon on generic suggestions | Bug. Sparkle appears on personalised entries only. | It's the signal that this is *about you*. |
| 4.10 | Small screen, personalised text truncated | Shorten the phrasing rather than truncating mid-word. Category name must stay visible. | The category name is the whole point of the nudge. |

---

## 5. Demo and Data-Integrity Edge Cases

| # | Situation | Required behaviour | Why |
|---|---|---|---|
| 5.1 | Viewer assumes sample customer data is real | Label it visibly in the UI and in the filename. | Simulated data must be obviously simulated. |
| 5.2 | Sample data mixed into main logic files | Not allowed. Keep it in its own clearly named file. | Reviewers must see which parts are real. |
| 5.3 | Demo lacks a multi-category customer | Blocks demoing the core multi-eligibility rule. Required profile. | Explicit spec requirement. |
| 5.4 | Demo lacks a no-signal customer | Blocks demoing correct suppression. Required profile. | Showing nothing *is* a feature. |
| 5.5 | Customer selector isn't obvious | Make it visible and labelled — it's the only way to see all three states. | Otherwise reviewers see one path and miss the logic. |
| 5.6 | Reviewer asks whether reviews are real | Answer plainly: reviews and AI outputs are real; engagement history is simulated. | Section 7 of the problem statement. |
| 5.7 | Temptation to fill review gaps with generated reviews | Never. Fewer real reviews beats more fake ones. | Fabricated reviews would invalidate the entire premise. |
| 5.8 | Temptation to pull ratings from Amazon/Zepto | Never. Unreliable, likely against their terms, and product matching can't be guaranteed. | Explicitly forbidden. |

---

## 6. Scope Discipline

Things that will feel tempting mid-build and must be refused:

- A generic "trending categories" fallback for no-signal customers — **no fallback, ever**
- "Customers like you also bought" — **similarity-based recommendation was tested and rejected**
- A push notification to bring users back — **in-app only**
- Auto-adding a purchased category to the frequent list — **customer-initiated only**
- Naming a competitor in the closing line — **own delivery speed only**
- Generating a review summary when data is thin — **hide the card instead**
- Building the frequent-categories button without the forward-looking prompt — **the pairing is the point**
