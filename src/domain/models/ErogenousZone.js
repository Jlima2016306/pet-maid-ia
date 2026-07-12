// domain/models/ErogenousZone.js
// A stimulable zone living at pets/{petId}/erogenousZones/{zoneId}.
//
// KEY CONCEPT: every zone ALWAYS exists and can be touched. It only *counts*
// as erogenous once progressToErogenous reaches 100. Before that, stimulating
// it contributes little/nothing to overall arousal. Progress is PERMANENT
// (a physical memory of the body). Formulas that move these values live
// elsewhere; this file is pure shape.

export function createErogenousZone({
  id = null,
  zoneId = "",              // ref to the catalog entry, e.g. "breasts"
  tier = "secondary",       // "primary" | "secondary" | "tertiary"

  // --- Permanent development (only goes up, never resets) ---
  progressToErogenous = 0,  // 0..100. At 100 -> isErogenous flips to true
  isErogenous = false,      // becomes true once progress hits 100
  developedSensitivity = 0, // 0..1. How intense the response is once developed
  totalStimulation = 0,     // lifetime counter of stimulation received

  // --- Response tuning ---
  threshold = 0.7,          // 0.7 (virgin) down to ~0.2 (well trained)

  // --- Momentary session state (rises/falls during interaction) ---
  currentArousal = 0,       // 0..1, transient

  // --- Observable body phenomena on this zone ---
  physicalDetails = [],     // e.g. ["gooseflesh","reddened","swollen"]

  updatedAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    zoneId,
    tier,
    progressToErogenous,
    isErogenous,
    developedSensitivity,
    totalStimulation,
    threshold,
    currentArousal,
    physicalDetails,
    updatedAt,
  };
}
