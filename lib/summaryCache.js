/**
 * Short in-memory cache for generated summaries.
 *
 * Purpose is rate-limit protection only: clicking around the demo shouldn't
 * fire a Gemini call per view and trip the free-tier per-minute limit.
 *
 * It is NOT a store of prewritten text. Two rules keep that honest:
 *   - entries expire after a few minutes
 *   - the Regenerate button bypasses it entirely (`fresh: true`), so that
 *     button is always a real, live API call
 *
 * Deliberately in-memory: it dies with the process, so nothing AI-generated is
 * ever persisted to disk or committed to the repo.
 */
const TTL_MS = 3 * 60 * 1000;

const cache = new Map();

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value) {
  cache.set(key, { value, at: Date.now() });
}

export const CACHE_TTL_MS = TTL_MS;
