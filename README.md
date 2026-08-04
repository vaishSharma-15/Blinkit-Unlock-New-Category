# Unlock New Category

![blinkit-green](https://img.shields.io/badge/-0C831F?style=flat-square&color=0C831F&label=%20) ![blinkit-yellow](https://img.shields.io/badge/-F8CB46?style=flat-square&color=F8CB46&label=%20) ![ink](https://img.shields.io/badge/-1F1F1F?style=flat-square&color=1F1F1F&label=%20) ![muted](https://img.shields.io/badge/-44454F?style=flat-square&color=44454F&label=%20)

A demo of one feature dropped into a working Blinkit-style app. When a
monthly-active customer has clearly shown interest in a category they've
never bought from, give them one honest, evidence-backed reason to try it.
Built from real order numbers and real reviews, not a generic "you might
also like."

Read [docs/ProblemStatement.md](docs/ProblemStatement.md) for the reasoning
behind it and [docs/PhaseWiseArchitecture.md](docs/PhaseWiseArchitecture.md)
for how it was built in stages.

## Running it

```bash
npm install
cp .env.example .env.local   # add your Gemini API key
npm run dev                  # http://localhost:3000
```

For a build closer to how the AI timing and caching actually behave in
production:

```bash
npm run build
npm start
```

No key, no problem. The app shell, the nudge copy and the eligibility logic
don't touch AI at all. Only the Unlock card's summary and its ask box need
`GEMINI_API_KEY`, and both just quietly hide themselves rather than show
something empty or broken if it's missing.

```bash
npm test    # ~99 unit tests, no network calls, no key needed
```

## The design system

The real Blinkit typeface isn't something this project can legitimately
ship. It isn't confirmed to be freely licensed, and using it anyway would
sit in the same category as faking a review or lifting a product photo
without rights. So the app uses **Plus Jakarta Sans** instead, a bold,
slightly rounded font that lands close to the same confident weight Blinkit
uses for big numbers like "8 minutes."

| Token | Value | Used for |
|---|---|---|
| `--blinkit-green` | `#0C831F` | Primary actions, prices, the "Still curious" pill |
| `--blinkit-yellow` | `#F8CB46` | Status bar, header, discount ribbons |
| `--foreground` | `#1F1F1F` | Body text |
| `--muted` | `#44454F` | Secondary text, dark enough to still pass contrast checks |
| `--border` | `#E9E9EB` | Card and input borders |

Everything lives in `app/globals.css` as CSS variables, wired into Tailwind
through a `@theme inline` block. That's what makes a class like
`bg-blinkit-green` usable anywhere in the app instead of hex codes getting
copy-pasted around.

## Demoing it

Tap the account circle in the top-right of the header to switch who you're
browsing as. Nothing here is a toggle. Each profile is a real, distinct
slice of sample history, and the eligibility engine reacts to it exactly
the way it would to genuine data.

| Customer | What it shows |
|---|---|
| Arjun (default) | Three eligible categories at once, nothing dropped to pick a "winner" |
| Priya | One eligible category, the simplest case |
| Meera | No engagement signal at all, sees "Popular first tries" instead of a personalized nudge |
| Rohan | Lapsed 62 days ago despite strong old interest, sees nothing at all, proving the monthly-active gate actually holds |
| Sana | A signal old enough to be shown honestly as stale, and a category she's already bought correctly excluded |

A full run-through: switch to Arjun, tap the search bar's nudge chip (or any
product tile), read the card, add it to cart and place the order, then
follow the prompt into whichever category is still left. The same panel has
a reset button that clears anything bought or searched this session, so the
next walkthrough starts clean.

## Real data vs. simulated data

The rule this whole project is built around: **real and simulated data
never sit in the same file.**

| File | Status |
|---|---|
| `data/categoryReviews.json` | Real, pulled from an actual corpus of Blinkit customer reviews |
| `data/products.json` | Real, product names, units, prices |
| `data/sampleCustomers.js` | Simulated, there's no access to real search or purchase history here |
| `data/sampleOrderStats.js` | Simulated, stands in for Blinkit's own order data |

Every sentence the AI writes is generated live from that real review text
and the order figures sitting next to it, so the two can always be checked
against each other. Nothing AI-generated is cached to disk or committed to
the repo. `lib/summaryCache.js` only holds it in memory for a few minutes,
and only to keep a burst of clicking from tripping the free-tier rate limit.

## Layout

```
app/            pages, plus the two API routes: /api/summary and /api/ask
components/     shell/ is the Blinkit app chrome, unlock/ is the feature itself
lib/            eligibility, nudge copy, order maths, the AI wrapper, each with tests next to it
data/           see the table above
docs/           problem statement, architecture notes, edge cases
```

`lib/eligibility.js` is deliberately not AI. It's plain set arithmetic:
categories engaged with, minus categories already bought. It only ever
looks at one customer's own history. No AI call decides who sees the
feature, only what it says once someone does.

## Deploying

Deploys to Vercel with no changes needed. Set `GEMINI_API_KEY` (and
optionally `GEMINI_MODEL`, if you want to point it at a different model) in
the project's environment variables. There's no database and nothing else
to configure.

Defaults to `gemini-3.1-flash-lite`, picked for the highest free-tier daily
request ceiling of the models a fresh API key can actually reach (the 2.5
series returns a 404 as "no longer available to new users"). If a demo
trips "quota reached," `GEMINI_MODEL` is the fastest way past it: point it
at a different model and redeploy, no code change needed.
