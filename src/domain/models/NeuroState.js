// domain/models/NeuroState.js
// EMBEDDED map inside pets/{petId}.neuroState
//
// All values are normalized 0.00 - 1.00.
// The AI reads these raw numbers; the prompt tells it how to interpret them.
// Based on Lövheim's Cube of Emotion (2012): the 8 basic emotions emerge from
// combinations of Serotonin, Dopamine and Noradrenaline (adrenaline here),
// plus basic neuroendocrinology (cortisol = HPA stress axis, oxytocin = bonding).

export function createNeuroState({
  dopamine = 0.5,     // reward / motivation. Low -> apathetic, bored
  serotonin = 0.5,    // mood stabilizer. Low -> irritable, depressive
  oxytocin = 0.5,     // bonding / trust / affection toward the user
  cortisol = 0.2,     // stress. Rises with hunger, cold, neglect. Chronic high -> illness
  endorphins = 0.3,   // natural analgesic. Spikes with exercise or to counter pain
  melatonin = 0.3,    // circadian rhythm. Rises with time of day -> sleep need
  adrenaline = 0.1,   // fight/flight. Spikes fast on scares, decays fast
} = {}) {
  return {
    dopamine,
    serotonin,
    oxytocin,
    cortisol,
    endorphins,
    melatonin,
    adrenaline,
  };
}

// Suggested clamps for use cases (keep every value within [0,1]):
export const NEURO_MIN = 0.0;
export const NEURO_MAX = 1.0;

export function clampNeuro(value) {
  return Math.min(NEURO_MAX, Math.max(NEURO_MIN, value));
}
