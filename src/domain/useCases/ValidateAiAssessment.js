// domain/useCases/ValidateAiAssessment.js
// PURE logic for step 4 of the interaction pipeline: check the AI's claims
// against the numeric ground truth and clamp its proposed stat changes.
//
//   - Afflictions: the AI may only claim ids from the closed vocabulary AND
//     that computeAfflictions() actually detected. Anything else is rejected
//     ("remitted") and reported back. Critical afflictions the AI missed are
//     force-included so the reply stays grounded in the real numbers.
//   - Stat changes: the AI proposes DELTAS. Only whitelisted paths pass, each
//     clamped to its per-interaction limit, and the final value stays in [0,1].
//
// No DB, no IA here. The orchestrator applies the result inside a transaction.

import { CRITICAL_SEVERITY } from "./AssessPetState.js";

// Paths the AI is allowed to move in ONE interaction, with the max |delta|.
// Everything else it proposes is silently dropped.
export const DELTA_LIMITS = {
  "neuroState.dopamine": 0.15,
  "neuroState.serotonin": 0.15,
  "neuroState.oxytocin": 0.15,
  "neuroState.cortisol": 0.15,
  "neuroState.endorphins": 0.15,
  "neuroState.melatonin": 0.15,
  "neuroState.adrenaline": 0.15,
  "arousalState.arousalLevel": 0.2,
  "physicalState.bloodGlucose": 0.1,
  "physicalState.hydration": 0.1,
  "physicalState.cnsFatigue": 0.1,
};

function getPath(obj, dotPath) {
  return dotPath.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export function validateAiAssessment(pet, computedAfflictions, assessment = {}) {
  const computedById = new Map(computedAfflictions.map((a) => [a.id, a]));
  const claimed = Array.isArray(assessment.afflictions) ? assessment.afflictions : [];
  const claimedSet = new Set(claimed.map(String));

  // Approved = numerically real AND (claimed by the AI OR critical).
  const approvedAfflictions = computedAfflictions.filter(
    (a) => claimedSet.has(a.id) || a.severity >= CRITICAL_SEVERITY
  );
  // Rejected = claimed by the AI but the numbers don't support it.
  const rejectedAfflictions = [...claimedSet].filter((id) => !computedById.has(id));

  // Deltas: whitelist the path, clamp the magnitude.
  const approvedDeltas = {};
  for (const [path, raw] of Object.entries(assessment.statChanges ?? {})) {
    const limit = DELTA_LIMITS[path];
    const delta = Number(raw);
    if (!limit || Number.isNaN(delta) || delta === 0) continue;
    approvedDeltas[path] = Math.max(-limit, Math.min(limit, delta));
  }

  return {
    approvedAfflictions,
    rejectedAfflictions,
    approvedDeltas,
    usedMemoryId: typeof assessment.usedMemoryId === "string" ? assessment.usedMemoryId : null,
  };
}

// Turns approved DELTAS into an absolute dot-notation update map computed from
// the pet document passed in. Called INSIDE runPetTransaction with the
// freshly-read pet, so concurrent interactions can't stack past the clamps.
export function applyApprovedDeltas(pet, approvedDeltas = {}) {
  const updates = {};
  for (const [path, delta] of Object.entries(approvedDeltas)) {
    const current = getPath(pet, path);
    const base = typeof current === "number" ? current : 0.5;
    updates[path] = Math.min(1, Math.max(0, base + delta));
  }
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date().toISOString();
  }
  return updates;
}
