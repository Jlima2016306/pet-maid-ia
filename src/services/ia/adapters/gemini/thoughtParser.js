// services/ia/adapters/gemini/thoughtParser.js
// Turns Gemini's raw text reply into a valid Thought domain model. Isolated so
// that if the model's output format drifts, you fix parsing in ONE place.

import { createThought } from "../../../../domain/models/Thought.js";
import { safeJsonParse, clamp01 } from "./_jsonUtils.js";

// Convert a raw Gemini response object into a Thought. Never throws on shape
// issues -- falls back to a safe neutral Thought so the app keeps running.
export function parseThought(rawText) {
  let data;
  try {
    data = safeJsonParse(rawText);
  } catch {
    return createThought({
      emotion: "confused",
      message: "...",
      intensity: 0.3,
      suggestedActions: [],
    });
  }

  return createThought({
    emotion: typeof data.emotion === "string" ? data.emotion : "neutral",
    message: typeof data.message === "string" ? data.message : "",
    intensity: clamp01(data.intensity),
    suggestedActions: Array.isArray(data.suggestedActions)
      ? data.suggestedActions.map(String)
      : [],
  });
}
