// domain/useCases/InitializePet.js
// Applies a personality preset + a body preset, ONLY filling parts not already
// set (idempotent). Returns TWO things:
//   - pet:            embedded blocks -> goes in the pets/{petId} document
//   - subcollections: organs + zones -> the orchestrator writes these to
//                      pets/{petId}/specialOrgans and /erogenousZones
// Still PURE: no DB access here.

import { createPet } from "../models/Pet.js";
import { getNeuroPreset } from "../presets/neuroPresets.js";
import { getPhysicalPreset } from "../presets/physicalPresets.js";
import { getMemoryPreset } from "../presets/memoryPresets.js";
import { createDefaultBodyParts } from "../models/BodyPart.js";
import { createCoreEmotion, CORE_EMOTIONS } from "../models/memory/CoreEmotion.js";
import { createPersonMemory } from "../models/memory/PersonMemory.js";

function isNeuroInitialized(pet) {
  return pet?._neuroSeeded === true;
}
function isBodyInitialized(pet) {
  return pet?._bodySeeded === true;
}

export function initializePet({
  existingPet = null,
  name = "",
  neuroPresetId,
  bodyPresetId,
}) {
  const base = existingPet ?? createPet({ name });
  const pet = { ...base };
  if (name) pet.name = name;

  // subcollection payload; stays empty if body already seeded
  const subcollections = {
    specialOrgans: {},
    erogenousZones: {},
    coreEmotions: [],
    preferences: [],
    experiences: [],
    personMemories: [],
  };

  // --- Neuro (personality): embedded, seed only if missing ---
  // Memory seeds (core emotions + personality preferences/experiences) ride
  // along with the neuro seeding so re-running init never duplicates them.
  if (!isNeuroInitialized(base)) {
    const neuro = getNeuroPreset(neuroPresetId);
    if (!neuro) throw new Error(`Unknown neuro preset: ${neuroPresetId}`);
    pet.neuroState = neuro;
    pet.personalityId = neuroPresetId;
    pet._neuroSeeded = true;

    // Seed core emotions (5 basic emotions)
    subcollections.coreEmotions = CORE_EMOTIONS.map(emotion =>
      createCoreEmotion(emotion, `Initial ${emotion} state`, { intensity: 0.5 })
    );

    // Seed the foundational relationship: the user IS the Master. Every
    // personality carries this memory from birth.
    subcollections.personMemories = [
      createPersonMemory("user", "Amo", "master", {
        firstMeetAt: new Date().toISOString(),
        trustLevel: 0.7,
        affectionLevel: 0.6,
      }, {
        intensity: 1,
        tags: ["person:user", "relationship:master", "el usuario es el amo"],
      }),
    ];

    // Seed personality-specific preferences and experiences
    const memoryPreset = getMemoryPreset(neuroPresetId);
    if (memoryPreset) {
      subcollections.preferences = memoryPreset.preferences || [];
      subcollections.experiences = memoryPreset.initialExperiences || [];
    }
  }

  // --- Body: embedded parts on the pet, organs/zones to subcollections ---
  if (!isBodyInitialized(base)) {
    const preset = getPhysicalPreset(bodyPresetId);
    if (!preset) throw new Error(`Unknown body preset: ${bodyPresetId}`);

    // embedded blocks -> pet document
    pet.physicalState = preset.physicalState;
    pet.appearance = preset.appearance;
    pet.arousalState = preset.arousalState;
    pet.bodyParts = base.bodyParts ?? createDefaultBodyParts();

    // subcollection blocks -> written separately by the orchestrator
    subcollections.specialOrgans = preset.specialOrgans ?? {};
    subcollections.erogenousZones = preset.erogenousZones ?? {};

    pet.bodyPresetId = bodyPresetId;
    pet._bodySeeded = true;
  }

  pet.updatedAt = new Date().toISOString();
  return { pet, subcollections };
}