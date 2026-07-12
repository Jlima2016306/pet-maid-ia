// domain/presets/physicalPresets.js
// Selectable BODY presets. Each preset now seeds:
//   - physicalState : simulation values + physiological symptoms
//   - appearance    : cosmetic descriptors
//   - arousalState  : starts calm/neutral
//   - specialOrgans : the pet is born with a vagina (+ clitoris sub-part)
//   - erogenousZones: catalog zones, all at 0 progress (not erogenous yet)
//
// Pure shape/data. Formulas that move any of this live elsewhere.

import { createPhysicalState } from "../models/PhysicalState.js";
import { createArousalState, createPhysiologicalSymptoms } from "../models/ArousalState.js";
import { createDefaultVagina } from "../models/SpecialOrgan.js";
import { createErogenousZone } from "../models/ErogenousZone.js";
import { EROGENOUS_ZONE_CATALOG } from "../models/erogenousZoneCatalog.js";

export const BODY_PRESET_IDS = {
  TALL: "tall170",
  PETITE: "petite149",
};

// --- Appearance model (cosmetic only) ---
export function createAppearance({
  heightLabel = "",
  build = "",
  bustSize = "",
  eyeColor = "",
  hairColor = "",
} = {}) {
  return { heightLabel, build, bustSize, eyeColor, hairColor };
}

// Build the full set of erogenous zones from the catalog, all starting at 0
// progress (present and touchable, but not erogenous yet). `seed` lets a preset
// nudge a couple of starting sensitivities without making them erogenous.
function buildErogenousZones(seed = {}) {
  const zones = {};
  for (const [zoneId, meta] of Object.entries(EROGENOUS_ZONE_CATALOG)) {
    zones[zoneId] = createErogenousZone({
      zoneId,
      tier: meta.tier,
      progressToErogenous: 0,
      isErogenous: false,
      developedSensitivity: seed[zoneId]?.developedSensitivity ?? 0,
      threshold: seed[zoneId]?.threshold ?? 0.7,
    });
  }
  return zones;
}

export const physicalPresets = {
  // 1.70 m — brown eyes, brown hair, fuller build.
  [BODY_PRESET_IDS.TALL]: () => ({
    physicalState: createPhysicalState({
      heightCm: 170,
      baseMassKg: 55,
      lipidReserves: 0.55,
      muscleStrength: 0.5,
      ...createPhysiologicalSymptoms(),
    }),
    appearance: createAppearance({
      heightLabel: "1.70 m",
      build: "curvy",
      bustSize: "large",
      eyeColor: "brown",
      hairColor: "brown",
    }),
    arousalState: createArousalState(),
    specialOrgans: {
      vagina: createDefaultVagina(),
    },
    // Larger bust preset starts breasts slightly more responsive (still 0 progress).
    erogenousZones: buildErogenousZones({
      breasts: { developedSensitivity: 0.1, threshold: 0.65 },
      nipples: { developedSensitivity: 0.1, threshold: 0.65 },
    }),
  }),

  // 1.49 m — petite, delicate, cute.
  [BODY_PRESET_IDS.PETITE]: () => ({
    physicalState: createPhysicalState({
      heightCm: 149,
      baseMassKg: 40,
      lipidReserves: 0.40,
      muscleStrength: 0.45,
      ...createPhysiologicalSymptoms(),
    }),
    appearance: createAppearance({
      heightLabel: "1.49 m",
      build: "petite",
      bustSize: "small",
      eyeColor: "brown",
      hairColor: "brown",
    }),
    arousalState: createArousalState(),
    specialOrgans: {
      vagina: createDefaultVagina(),
    },
    // Petite preset starts neck/ears slightly more responsive.
    erogenousZones: buildErogenousZones({
      neck: { developedSensitivity: 0.1, threshold: 0.6 },
      earlobes: { developedSensitivity: 0.1, threshold: 0.6 },
    }),
  }),
};

export function getPhysicalPreset(presetId) {
  const factory = physicalPresets[presetId];
  return factory ? factory() : null;
}