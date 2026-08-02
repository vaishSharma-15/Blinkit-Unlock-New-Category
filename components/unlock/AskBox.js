"use client";

import { useState } from "react";

/**
 * Free-text question box. Every question is sent to the model as typed —
 * there is no preset list and no keyword matching, so an unscripted question
 * during a demo gets a genuinely generated answer.
 */
export default function AskBox({ productId }) {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState({ status: "idle" });

  async function ask(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Something broke." });
        return;
      }
      setState({ status: "done", ...data });
    } catch {
      setState({ status: "error", message: "Couldn't reach the server." });
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <form onSubmit={ask} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
          placeholder="Ask anything about this product…"
          aria-label="Ask about this product"
          className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-[12px] outline-none focus:border-blinkit-green"
        />
        <button
          type="submit"
          disabled={state.status === "loading" || !question.trim()}
          className="shrink-0 rounded-lg bg-blinkit-green px-3 py-2 text-[12px] font-bold text-white disabled:opacity-40"
        >
          {state.status === "loading" ? "…" : "Ask"}
        </button>
      </form>

      {state.status === "loading" && (
        <p className="mt-2 flex items-center gap-2 text-[12px] text-muted">
          <Spinner />
          Reading customer reviews and order data…
        </p>
      )}

      {state.status === "error" && (
        <p className="mt-2 text-[12px] text-[#c0392b]">{state.message}</p>
      )}

      {state.status === "done" && (
        <div className="mt-2 rounded-lg bg-[#f7f7f8] p-2.5">
          <p className="text-[12px] leading-relaxed">{state.answer}</p>
          {state.sources?.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[10px] font-semibold text-muted">
                Based on {state.reviewsUsed} real customer reviews
              </summary>
              <ul className="mt-1 space-y-1">
                {state.sources.map((s, i) => (
                  <li key={i} className="text-[10px] leading-snug text-muted">
                    “{s.text}…” <span>({s.rating}★)</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent"
      aria-hidden="true"
    />
  );
}
