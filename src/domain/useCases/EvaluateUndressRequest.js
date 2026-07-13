// domain/useCases/EvaluateUndressRequest.js
// PURE logic for the "please take that off" flow. The AI decides in character
// whether the pet agrees, but — like everything else in the pipeline — the
// decision must be NUMERICALLY grounded: we compute a disposition score from
// the pet's real state, hand it to the AI as guidance, and afterwards reject
// an acceptance the numbers can't justify. No DB, no IA here.

import { clampDeltas } from "./ValidateAiAssessment.js";

// How much each personality leans toward complying with the Master's request.
const PERSONALITY_BIAS = {
  maidHevel: 0.35,      // absolute obedience
  maidYandere: 0.15,    // anything for Master
  maidDeredere: 0.10,   // eager to please
  maidTsundere: -0.15,  // defensive by default
  emotionless: 0.0,     // indifferent
};

// Below this score, an AI "yes" is overridden to a refusal (remitted).
export const MIN_ACCEPT_DISPOSITION = 0.15;

// Disposition 0..1 from bonding, arousal, mood and stress plus personality.
// Returns the factors too, so a refusal/override is always explainable.
export function computeUndressDisposition(pet) {
  const neuro = pet.neuroState ?? {};
  const arousal = pet.arousalState?.arousalLevel ?? 0;
  const bias = PERSONALITY_BIAS[pet.personalityId] ?? 0;

  const raw =
    0.45 * (neuro.oxytocin ?? 0.5) +
    0.25 * arousal +
    0.15 * (neuro.dopamine ?? 0.5) -
    0.35 * (neuro.cortisol ?? 0.2) +
    bias;

  const score = Math.min(1, Math.max(0, raw));
  return {
    score: Number(score.toFixed(2)),
    factors: {
      oxytocin: neuro.oxytocin ?? 0.5,
      arousalLevel: arousal,
      dopamine: neuro.dopamine ?? 0.5,
      cortisol: neuro.cortisol ?? 0.2,
      personalityBias: bias,
    },
  };
}

// Validates the AI's decision against the numbers and the actual wardrobe:
//   - itemIds are filtered to garments actually equipped (and, if the user
//     requested specific ones, to that subset).
//   - an acceptance with no valid garment left becomes a refusal.
//   - an acceptance below MIN_ACCEPT_DISPOSITION is overridden to a refusal.
//   - proposed stat deltas go through the same whitelist+clamp as /interact.
export function validateUndressDecision(pet, disposition, decision = {}, equippedIds = [], requestedIds = null) {
  const equipped = new Set(equippedIds);
  const allowed = requestedIds && requestedIds.length > 0
    ? new Set(requestedIds.filter((id) => equipped.has(id)))
    : equipped;

  let itemIds = (Array.isArray(decision.itemIds) ? decision.itemIds.map(String) : [])
    .filter((id) => allowed.has(id));

  // If the AI accepted but named nothing valid, fall back to the user's
  // explicit request; with nothing valid either way it becomes a refusal.
  if (decision.accepts === true && itemIds.length === 0) {
    itemIds = [...allowed];
  }

  let accepts = decision.accepts === true && itemIds.length > 0;
  let overridden = false;

  if (accepts && disposition.score < MIN_ACCEPT_DISPOSITION) {
    accepts = false;
    itemIds = [];
    overridden = true; // numbers say she really wouldn't
  }

  return {
    accepts,
    itemIds: accepts ? itemIds : [],
    overridden,
    reason: typeof decision.reason === "string" ? decision.reason : "",
    approvedDeltas: clampDeltas(decision.statChanges),
  };
}
