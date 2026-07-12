// domain/useCases/FeedPet.js
// PURE logic. Given the current pet, returns a flat field-update map (dot
// notation) describing what feeding changes. No DB, no IA here. The
// orchestrator applies this map inside an atomic transaction.

import { clampNeuro } from "../models/NeuroState.js";

// nutrition 0..1 = how filling the food is.
export function feedPet(pet, nutrition = 0.3) {
  const phys = pet.physicalState ?? {};
  const neuro = pet.neuroState ?? {};

  const newGlucose = Math.min(1, (phys.bloodGlucose ?? 0.5) + nutrition);
  // Eating relieves stress a bit and nudges dopamine (anticipation/reward).
  const newCortisol = clampNeuro((neuro.cortisol ?? 0.2) - nutrition * 0.3);
  const newDopamine = clampNeuro((neuro.dopamine ?? 0.5) + nutrition * 0.2);
  // Overeating stores lipids.
  const overeat = Math.max(0, (phys.bloodGlucose ?? 0.5) + nutrition - 1);
  const newLipids = Math.min(1, (phys.lipidReserves ?? 0.5) + overeat * 0.5);

  return {
    "physicalState.bloodGlucose": newGlucose,
    "physicalState.lipidReserves": newLipids,
    "neuroState.cortisol": newCortisol,
    "neuroState.dopamine": newDopamine,
    updatedAt: new Date().toISOString(),
  };
}
