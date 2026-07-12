// domain/models/ArousalState.js
// New EMBEDDED block on the pet: pets/{petId}.arousalState, plus the new
// physiological symptom fields that belong in PhysicalState. Pure shape only.
//
// These are SYMPTOMS/accumulators. Formulas that drive them (from neuro +
// stimulation) live elsewhere. The AI never sets these; our engine does.

export function createArousalState({
  arousalLevel = 0.0,      // 0..1 overall accumulated arousal
  vasocongestion = 0.0,    // 0..1 local blood-flow pooling (feeds temperature)
  refractoryTimer = 0,     // seconds of post-climax cooldown (0 = ready)
  climaxCount = 0,         // session counter
} = {}) {
  return { arousalLevel, vasocongestion, refractoryTimer, climaxCount };
}

// Extra physiological symptom fields to MERGE into PhysicalState.
// (Add these keys to createPhysicalState so they persist on the pet.)
export function createPhysiologicalSymptoms({
  heartRate = 70,          // bpm. Rises 70 -> 110-180 near climax
  respiratoryRate = 16,    // breaths/min. Rises 16 -> ~40
  muscleTension = 0.1,     // 0..1 whole-body myotonia; drops to 0 at climax
} = {}) {
  return { heartRate, respiratoryRate, muscleTension };
}
