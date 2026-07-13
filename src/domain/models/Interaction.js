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

// Call #2 result: the in-character reply, split in TWO channels:
//   message = only what she SAYS out loud (dialogue).
//   action  = narration of what the user is seeing and what her body does/
//             feels — explicit about the gazed part per DB data (garment if
//             covered, bare skin/nipples/etc. if exposed).
// `saveMemory` is the HIDDEN directive (consumed server-side, never returned
// to the user): if present, the orchestrator persists a new memory.
export function createInteractionReply({
  emotion = "neutral",
  message = "",            // Spanish dialogue only
  action = "",             // Spanish narration: feelings + what the user sees
  intensity = 0.5,
  gazeTarget = null,       // body part / zone id the user was looking at, or null
  saveMemory = null,       // { kind, description, intensity, tags, subject?, feeling? } | null
} = {}) {
  return { emotion, message, action, intensity, gazeTarget, saveMemory };
}

// Undress-request decision: whether she agrees to remove garments. Everything
// is a PROPOSAL — validateUndressDecision decides what survives.
export function createUndressDecision({
  accepts = false,
  itemIds = [],            // garment ids she agrees to remove
  reason = "",             // short in-character rationale (internal)
  statChanges = {},        // proposed DELTAS, same contract as the assessment
} = {}) {
  return { accepts, itemIds, reason, statChanges };
}
