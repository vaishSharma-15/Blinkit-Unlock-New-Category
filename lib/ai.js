import { GoogleGenAI } from "@google/genai";

/**
 * Single wrapper around the AI provider. Every AI call in this project goes
 * through here — the API routes never construct their own client.
 *
 * Provider-agnostic on purpose: swapping models (or providers) should mean
 * editing this file only. Currently Google Gemini, chosen for its free tier.
 *
 * Server-side only. Importing this from a client component would leak the key.
 */

/**
 * Free-tier quota is per model, and it is easy to exhaust during a day of
 * demoing. `GEMINI_MODEL` lets you move to a model with headroom without a
 * code change or a redeploy — same live calls, same prompts, different pool.
 *
 * gemini-3.1-flash-lite is the default because, of the models this project's
 * API key can actually reach (the 2.5 series returns 404 "no longer
 * available to new users" on it), it has the most free-tier headroom for a
 * demo: the highest requests-per-day of the reachable models, comfortably
 * covering a full walkthrough plus a burst of ask-box questions.
 */
export const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

let client;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }
  // Reused across requests so the SDK keeps its connection pool warm.
  // Reads GEMINI_API_KEY from the environment itself.
  client ??= new GoogleGenAI({});
  return client;
}

/**
 * Send one prompt, get the text back.
 *
 * @param {object} opts
 * @param {string} opts.system           System instruction.
 * @param {string} opts.user             User message.
 * @param {number} [opts.maxTokens]      Output cap.
 * @param {string} [opts.thinkingLevel]  "minimal" | "low" | "medium" | "high".
 *                                       Omitted means the model's own default.
 * @returns {Promise<string>} The response text.
 */
export async function complete({ system, user, maxTokens = 2000, thinkingLevel }) {
  const interaction = await getClient().interactions.create({
    model: MODEL,
    system_instruction: system,
    input: user,
    generation_config: {
      max_output_tokens: maxTokens,
      ...(thinkingLevel ? { thinking_level: thinkingLevel } : {}),
    },
  });

  // Thinking tokens count against max_output_tokens, so a tight cap yields
  // status "incomplete" and a half-finished sentence rather than an error.
  // Verified against the live API: 200 tokens truncates mid-clause, 2000 does
  // not. Never return that — a truncated review summary is exactly the
  // low-confidence output the feature exists to avoid, so callers must be able
  // to hide the card instead.
  if (interaction.status !== "completed") {
    throw new Error(`Model returned status "${interaction.status}".`);
  }

  const text = interaction.output_text?.trim();

  // output_text is optional in the SDK's own types — a safety block lands here.
  if (!text) {
    throw new Error("Model returned no text.");
  }

  return text;
}
