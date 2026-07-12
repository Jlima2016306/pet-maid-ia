// services/ia/adapters/gemini/_jsonUtils.js
// Tiny shared helpers for parsing Gemini's JSON replies. Kept in one place so
// every parser (thoughtParser, interactionParser) cleans/clamps the same way.

// Defensive: strip accidental markdown fences, then JSON.parse.
export function safeJsonParse(rawText) {
  const cleaned = String(rawText)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleaned);
}

// Clamp a numeric value into [0,1]; fall back if it isn't a number.
export function clamp01(n, fallback = 0.5) {
  const x = Number(n);
  if (Number.isNaN(x)) return fallback;
  return Math.min(1, Math.max(0, x));
}
