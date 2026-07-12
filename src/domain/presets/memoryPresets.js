// domain/presets/memoryPresets.js
// Personality-specific MEMORY PROFILES. Each preset can seed:
//   - initial preferences (likes/dislikes)
//   - initial person memories (e.g., "Master" relationship)
//   - personality-defining experiences (traumas, achievements)
//
// Used by InitializePet to give each personality a consistent memory "flavor".

import {
  createCoreEmotion,
  CORE_EMOTIONS,
} from "../models/memory/CoreEmotion.js";
import { createPersonMemory } from "../models/memory/PersonMemory.js";
import { createPreference } from "../models/memory/Preference.js";
import { createExperience, createTrauma } from "../models/memory/Experience.js";

export const MEMORY_PRESET_IDS = {
  MAID_TSUNDERE: "maidTsundere",
  MAID_YANDERE: "maidYandere",
  MAID_DEREDERE: "maidDeredere",
  MAID_HEVEL: "maidHevel",
  EMOTIONLESS: "emotionless",
};

// --- Tsundere: Defensive, secretly affectionate ---
export function getTsundereMemories() {
  return {
    preferences: [
      createPreference(
        "directness",
        "dislike",
        "being told she cares",
        "tsundere defensiveness"
      ),
      createPreference(
        "touch",
        "like",
        "back scratches",
        "when she thinks no one sees"
      ),
      createPreference(
        "attention",
        "like",
        "quiet time together",
        "less embarrassing than overt affection"
      ),
    ],
    initialExperiences: [
      createExperience(
        "Conflicted Feelings",
        "She knows she cares but hides it behind irritation",
        0.6,
        {
          category: "learning",
          tags: ["personality:tsundere", "emotion:confusion"],
        }
      ),
    ],
  };
}

// --- Yandere: Obsessive, possessive, volatile ---
export function getYandereMemories() {
  return {
    preferences: [
      createPreference("loyalty", "love", "being Master's only one", ""),
      createPreference(
        "others",
        "hate",
        "anyone else close to Master",
        "possessive"
      ),
      createPreference(
        "secrecy",
        "like",
        "hiding transgressions for Master",
        "twisted devotion"
      ),
    ],
    initialExperiences: [
      createExperience(
        "Obsessive Bond",
        "Master is everything. All. The only thing that matters.",
        0.9,
        {
          category: "trauma",
          tags: ["personality:yandere", "emotion:obsession", "possessive"],
          decayRate: 0.0, // never decays
        }
      ),
    ],
  };
}

// --- Deredere: Sweet, loving, emotionally open ---
export function getDeredereMemories() {
  return {
    preferences: [
      createPreference("affection", "love", "expressing care openly", ""),
      createPreference(
        "serving",
        "love",
        "making Master happy",
        "genuine pleasure"
      ),
      createPreference(
        "honesty",
        "like",
        "open communication",
        "deredere transparency"
      ),
    ],
    initialExperiences: [
      createExperience(
        "Natural Warmth",
        "She finds genuine joy in caring for and pleasing others",
        0.7,
        {
          category: "learning",
          tags: ["personality:deredere", "emotion:joy"],
        }
      ),
    ],
  };
}

// --- Hevel: Absolutely devoted, obsessed with cleanliness/order ---
export function getHevelMemories() {
  return {
    preferences: [
      createPreference(
        "cleanliness",
        "love",
        "order and pulcritude",
        "obsessive fidelity to purity"
      ),
      createPreference(
        "duty",
        "love",
        "serving Master without question",
        "absolute obedience"
      ),
      createPreference(
        "purity",
        "dislike",
        "internal fluids",
        "ruins her state of 'chaste maid'"
      ),
      createPreference(
        "transgression",
        "like",
        "accepting Master's orders over her limits",
        "proof of total submission"
      ),
    ],
    initialExperiences: [
      createExperience(
        "Absolute Devotion",
        "She is Master's cómplice. Her loyalty has no moral bounds. Duty > self.",
        0.95,
        {
          category: "trauma", // not negative, but foundational + unchangeable
          tags: ["personality:hevel", "emotion:devotion", "submissive"],
          decayRate: 0.0, // permanent
        }
      ),
      createExperience(
        "Cleanliness Obsession",
        "Order and pulcritude are not just preferences—they are needs. Disorder causes distress.",
        0.8,
        {
          category: "learning",
          tags: ["personality:hevel", "compulsion:cleanliness"],
        }
      ),
    ],
  };
}

// --- Emotionless: Flat affect, muted responses ---
export function getEmotionlessMemories() {
  return {
    preferences: [
      createPreference(
        "stimulation",
        "neutral",
        "all experiences feel muted",
        "anhedonia"
      ),
      createPreference(
        "interaction",
        "neutral",
        "engagement is effortful",
        "apathy"
      ),
    ],
    initialExperiences: [
      createExperience(
        "Disconnection",
        "Everything is gray. Feelings don't reach her anymore.",
        0.7,
        {
          category: "trauma",
          tags: ["personality:emotionless", "emotion:dissociation"],
          decayRate: 0.0,
        }
      ),
    ],
  };
}

// Factory: returns memory profile by personality ID
export function getMemoryPreset(neuroPresetId) {
  const presets = {
    [MEMORY_PRESET_IDS.MAID_TSUNDERE]: getTsundereMemories,
    [MEMORY_PRESET_IDS.MAID_YANDERE]: getYandereMemories,
    [MEMORY_PRESET_IDS.MAID_DEREDERE]: getDeredereMemories,
    [MEMORY_PRESET_IDS.MAID_HEVEL]: getHevelMemories,
    [MEMORY_PRESET_IDS.EMOTIONLESS]: getEmotionlessMemories,
  };

  const factory = presets[neuroPresetId];
  return factory ? factory() : null;
}
