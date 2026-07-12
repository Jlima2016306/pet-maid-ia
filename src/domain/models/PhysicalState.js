// domain/models/PhysicalState.js
// EMBEDDED map inside pets/{petId}.physicalState
//
// The body seeks homeostasis (balance). When values drift from their ideal
// center, the brain reacts (e.g. cortisol spikes). Based on Basal Metabolic
// Rate (BMR) and human thermoregulation; glucose/lipids imitate the
// insulin/glucagon cycle.

export function createPhysicalState({
  // --- Metabolism (normalized 0.00 - 1.00 unless noted) ---
  bloodGlucose = 0.7,      // fast energy. Drops hourly, rises fast when eating
  lipidReserves = 0.5,     // fat / weight. Burned when glucose hits 0; stored on overeating
  hydration = 0.8,         // water level. More critical than food
  coreTemperature = 37.0,  // Celsius. Ideal ~37.0

  // --- Physical attributes ---
  heightCm = 40,           // grows with age/species curve
  baseMassKg = 3.0,        // base mass before lipid reserves
  muscleStrength = 0.5,    // multiplier. Atrophies without physical tasks, grows with them
  cnsFatigue = 0.2,        // Central Nervous System fatigue. Rises while awake
} = {}) {
  return {
    bloodGlucose,
    lipidReserves,
    hydration,
    coreTemperature,
    heightCm,
    baseMassKg,
    muscleStrength,
    cnsFatigue,
  };
}

// --- Derived helpers (computed, NOT stored, to avoid stale data) ---

// weight = base mass + contribution from lipid reserves
export function computeWeightKg(physicalState) {
  const { baseMassKg, lipidReserves } = physicalState;
  // lipidReserves 0..1 maps to up to +50% of base mass
  return baseMassKg * (1 + lipidReserves * 0.5);
}

// Body Mass Index = weight(kg) / height(m)^2
export function computeBmi(physicalState) {
  const weightKg = computeWeightKg(physicalState);
  const heightM = physicalState.heightCm / 100;
  if (heightM <= 0) return 0;
  return weightKg / (heightM * heightM);
}

export const IDEAL_CORE_TEMPERATURE = 37.0;
