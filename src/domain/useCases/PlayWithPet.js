// domain/useCases/PlayWithPet.js
// PURE logic for playing. Raises dopamine, oxytocin (bonding) and endorphins,
// but spends glucose and adds CNS fatigue. Returns a dot-notation update map.

import { clampNeuro } from "../models/NeuroState.js";

// intensity 0..1 = how energetic the play session is.
export function playWithPet(pet, intensity = 0.4) {
  const phys = pet.physicalState ?? {};
  const neuro = pet.neuroState ?? {};

  return {
    "neuroState.dopamine": clampNeuro((neuro.dopamine ?? 0.5) + intensity * 0.25),
    "neuroState.oxytocin": clampNeuro((neuro.oxytocin ?? 0.5) + intensity * 0.15),
    "neuroState.endorphins": clampNeuro((neuro.endorphins ?? 0.3) + intensity * 0.2),
    "physicalState.bloodGlucose": Math.max(0, (phys.bloodGlucose ?? 0.5) - intensity * 0.2),
    "physicalState.cnsFatigue": Math.min(1, (phys.cnsFatigue ?? 0.2) + intensity * 0.15),
    updatedAt: new Date().toISOString(),
  };
}
