// services/ia/adapters/gemini/interactionParser.js
// Turns Gemini's raw replies for the interaction pipeline into domain shapes
// (AiAssessment / InteractionReply). Defensive like thoughtParser: shape
// problems degrade to safe defaults instead of throwing, so one malformed
// model reply never breaks the pipeline.

import { createAiAssessment, createInteractionReply } from "../../../../domain/models/Interaction.js";
import { safeJsonParse, clamp01 } from "./_jsonUtils.js";

// Call #1 result. Unknown affliction ids / illegal paths are NOT filtered here
// — that is the domain validator's job — we only guarantee the shape.
export function parseAssessment(rawText) {
  let data;
  try {
    data = safeJsonParse(rawText);
  } catch {
    return createAiAssessment(); // empty proposal -> validator approves nothing extra
  }

  const statChanges = {};
  if (data.statChanges && typeof data.statChanges === "object") {
    for (const [path, delta] of Object.entries(data.statChanges)) {
      const n = Number(delta);
      if (!Number.isNaN(n)) statChanges[path] = n;
    }
  }

  return createAiAssessment({
    afflictions: Array.isArray(data.afflictions) ? data.afflictions.map(String) : [],
    statChanges,
    usedMemoryId: typeof data.usedMemoryId === "string" && data.usedMemoryId !== "null"
      ? data.usedMemoryId
      : null,
    why: typeof data.why === "string" ? data.why : "",
  });
}

const MEMORY_KINDS = ["ephemeral", "experience", "preference"];

function parseSaveMemory(hidden) {
  const m = hidden?.saveMemory;
  if (!m || typeof m !== "object") return null;
  const description = typeof m.description === "string" ? m.description.trim() : "";
  if (!description) return null;
  return {
    kind: MEMORY_KINDS.includes(m.kind) ? m.kind : "ephemeral",
    description,
    intensity: clamp01(m.intensity),
    tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
    subject: typeof m.subject === "string" ? m.subject : null,
    feeling: typeof m.feeling === "string" ? m.feeling : null,
  };
}

// Call #2 result. Falls back to a confused-but-valid reply on parse failure.
export function parseInteractionReply(rawText) {
  let data;
  try {
    data = safeJsonParse(rawText);
  } catch {
    return createInteractionReply({ emotion: "confundida", message: "...", intensity: 0.3 });
  }

  return createInteractionReply({
    emotion: typeof data.emotion === "string" ? data.emotion : "neutral",
    message: typeof data.message === "string" ? data.message : "",
    intensity: clamp01(data.intensity),
    gazeTarget: typeof data.gazeTarget === "string" && data.gazeTarget !== "null"
      ? data.gazeTarget
      : null,
    saveMemory: parseSaveMemory(data.hidden),
  });
}
