// domain/useCases/SleepPet.js
// PURE logic for sleeping. Recovers CNS fatigue, lowers melatonin and cortisol,
// and toggles the isAsleep flag. Returns a dot-notation update map.

import { clampNeuro } from "../models/NeuroState.js";

// hours 0..1 (normalized) = how long/deep the rest is.
export function sleepPet(pet, hours = 0.5) {
  const phys = pet.physicalState ?? {};
  const neuro = pet.neuroState ?? {};

  return {
    "physicalState.cnsFatigue": Math.max(0, (phys.cnsFatigue ?? 0.2) - hours * 0.6),
    "neuroState.melatonin": clampNeuro((neuro.melatonin ?? 0.3) - hours * 0.4),
    "neuroState.cortisol": clampNeuro((neuro.cortisol ?? 0.2) - hours * 0.2),
    "neuroState.serotonin": clampNeuro((neuro.serotonin ?? 0.5) + hours * 0.1),
    isAsleep: true,
    updatedAt: new Date().toISOString(),
  };
}

// Waking up just clears the flag.
export function wakePet() {
  return { isAsleep: false, updatedAt: new Date().toISOString() };
}
