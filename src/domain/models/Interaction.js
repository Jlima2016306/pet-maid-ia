// domain/models/Interaction.js
// Shapes for the two AI calls of the interaction pipeline. Pure factories,
// mirroring the Thought.js pattern: the parser builds these from raw model
// output so the rest of the app never touches provider-specific JSON.

// Call #1 result: what the AI THINKS is wrong and how the message moves stats.
// Everything here is a PROPOSAL — validateAiAssessment decides what survives.
export function createAiAssessment({
  afflictions = [],        // array<string> ids from AFFLICTION_VOCABULARY
  statChanges = {},        // { "neuroState.cortisol": -0.05, ... } DELTAS
  usedMemoryId = null,     // memory the AI wants to lean on, or null
  why = "",                // short rationale (debug/telemetry only)
} = {}) {
  return { afflictions, statChanges, usedMemoryId, why };
}

// Call #2 result: the in-character reply. `saveMemory` is the HIDDEN directive
// (consumed server-side, never returned to the user): if present, the
// orchestrator persists a new memory of the given kind.
export function createInteractionReply({
  emotion = "neutral",
  message = "",            // Spanish, first person, includes gazed-part description
  intensity = 0.5,
  gazeTarget = null,       // body part id the user was looking at, or null
  saveMemory = null,       // { kind, description, intensity, tags, subject?, feeling? } | null
} = {}) {
  return { emotion, message, intensity, gazeTarget, saveMemory };
}
