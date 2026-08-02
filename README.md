# Unlock New Category

A working demo of a feature for Blinkit: nudging a monthly-active customer into
**one category they have already shown interest in but never bought from**, and
giving them enough honest evidence to take the first order.

Built as a phone-width app shell so the feature is judged in the place it would
actually live. See [docs/ProblemStatement.md](docs/ProblemStatement.md) for the
what and [docs/PhaseWiseArchitecture.md](docs/PhaseWiseArchitecture.md) for the
how.

## Running it

```bash
npm install
cp .env.example .env.local   # then add your Gemini API key
npm run dev                  # http://localhost:3000
```

A production build, which is what the AI timing and caching behaviour should be
judged on:

```bash
npm run build
npm start
```

Without `GEMINI_API_KEY` the app still runs — the shell, the nudge and the
eligibility logic are all AI-free. Only the Unlock card's summary and the ask
box need the key, and both hide themselves rather than render empty when it is
missing.

```bash
npm test    # 41 unit tests, no network, no API key needed
```

## Demoing it

The yellow bar at the top is a demo control, not app chrome. It switches which
sample customer you are viewing as, and each one exists to show a different
outcome:

| Customer | Shows |
|---|---|
| Arjun — multi signal | Three eligible categories; sparkle nudges, card, still-curious row, post-purchase prompt |
| Priya — single signal | One eligible category, and nothing left to suggest after buying |
| Meera — no signal | The control state: no sparkle, no card, no suggestion anywhere |
| Rohan — lapsed | Strong interest but not a MAC, so the feature never appears |
| Sana — stale / already bought | Both disqualifying rules at once |

The full loop, in one click-through: pick Arjun → tap the sparkled search
placeholder → **Buy now** on the Pet Care card → follow the prompt to Skincare.
Back on the home screen the nudge has moved on and Pet Care is pinned. **Reset**
clears demo purchases so you can walk it again.

## Real data vs. simulated data

The single rule the project is organised around: **real and simulated data never
live in the same file.**

| File | Status |
|---|---|
| `data/categoryReviews.json` | **Real** — extracted from a corpus of Blinkit customer reviews |
| `data/products.json` | **Real** — product names, units, prices |
| `data/sampleCustomers.js` | **Simulated** — we have no access to real search or purchase history |
| `data/sampleOrderStats.js` | **Simulated** — stands in for Blinkit's own order data |

Every AI sentence in the app is generated live from the real review text plus
the order figures, and the raw figures are rendered beside the sentence so the
two can be compared. Nothing AI-generated is cached to disk or committed.

## Layout

```
app/            pages and the two API routes (/api/summary, /api/ask)
components/     shell/ — the Blinkit app;  unlock/ — the feature
lib/            eligibility, nudge copy, order maths, AI wrapper (+ tests)
data/           see the table above
docs/           problem statement, architecture, edge cases
```

The eligibility engine (`lib/eligibility.js`) is deliberately **not** AI: it is
pure set arithmetic — engaged categories minus purchased categories — and it
only ever reads one customer's own history.

## Deploying

Deploys to Vercel as-is. Set `GEMINI_API_KEY` in the project's environment
variables; there is nothing else to configure and no database.
