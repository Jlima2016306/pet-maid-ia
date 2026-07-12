// domain/presets/neuroPresets.js
// Selectable PERSONALITY presets -> initial neuroState values (0.00 - 1.00).
// Mapped using Lövheim's Cube (serotonin / dopamine / adrenaline) plus
// cortisol (stress) and oxytocin (bonding) to shape each temperament.
//
// These are ONLY the STARTING values. Once initialized, the live simulation
// takes over and these numbers drift with the pet's experiences.

import { createNeuroState } from "../models/NeuroState.js";

export const NEURO_PRESET_IDS = {
  MAID_TSUNDERE: "maidTsundere",
  MAID_YANDERE: "maidYandere",
  MAID_DEREDERE: "maidDeredere",
  MAID_HEVEL: "maidHevel",
  EMOTIONLESS: "emotionless",
};

export const neuroPresets = {
  // Cold/irritable on the surface, hidden affection underneath.
  // Low-ish serotonin (easily irritable), reactive adrenaline,
  // moderate oxytocin (affection she won't admit), moderate cortisol.
  [NEURO_PRESET_IDS.MAID_TSUNDERE]: () =>
    createNeuroState({
      dopamine: 0.45,
      serotonin: 0.35,
      oxytocin: 0.50,
      cortisol: 0.45,
      endorphins: 0.30,
      melatonin: 0.30,
      adrenaline: 0.35,
    }),

  // Obsessive, intense attachment. Very high oxytocin (fixation),
  // volatile mood (low serotonin), high dopamine (user = reward),
  // elevated cortisol + adrenaline (possessive, on edge).
  [NEURO_PRESET_IDS.MAID_YANDERE]: () =>
    createNeuroState({
      dopamine: 0.70,
      serotonin: 0.30,
      oxytocin: 0.90,
      cortisol: 0.60,
      endorphins: 0.35,
      melatonin: 0.30,
      adrenaline: 0.55,
    }),

  // Sweet, loving, emotionally stable. High serotonin (calm mood),
  // high oxytocin (open affection), high dopamine (easily delighted),
  // low cortisol and low adrenaline (relaxed).
  [NEURO_PRESET_IDS.MAID_DEREDERE]: () =>
    createNeuroState({
      dopamine: 0.65,
      serotonin: 0.75,
      oxytocin: 0.80,
      cortisol: 0.15,
      endorphins: 0.40,
      melatonin: 0.30,
      adrenaline: 0.15,
    }),

  // Absolute devotion, extreme loyalty without moral limits. Submissive obedience
  // masked with subtle defiance. Obsessed with cleanliness/order (cortisol rises
  // if disheveled). Very high oxytocin (bonded to Master), low dopamine (no selfish
  // desires), moderate serotonin (emotionally stable despite submission), low adrenaline
  // (compliant, not reactive). High focus + low suspicion = total trust.
  [NEURO_PRESET_IDS.MAID_HEVEL]: () =>
    createNeuroState({
      dopamine: 0.35,
      serotonin: 0.55,
      oxytocin: 0.85,
      cortisol: 0.40,
      endorphins: 0.45,
      melatonin: 0.30,
      adrenaline: 0.20,
      focus: 0.8,
      bias: "obedient",
      suspicionLevel: 0.05,
      emotionalMomentum: 0.65,
      recentTrauma: null,
    }),

  // Flat affect. Everything muted -> apathetic, hard to move emotionally.
  // Low dopamine (no drive), neutral serotonin, low oxytocin (detached),
  // low cortisol and adrenaline (unreactive).
  [NEURO_PRESET_IDS.EMOTIONLESS]: () =>
    createNeuroState({
      dopamine: 0.20,
      serotonin: 0.50,
      oxytocin: 0.10,
      cortisol: 0.15,
      endorphins: 0.20,
      melatonin: 0.30,
      adrenaline: 0.10,
    }),
};

// Returns a fresh neuroState for the given preset id, or null if unknown.
export function getNeuroPreset(presetId) {
  const factory = neuroPresets[presetId];
  return factory ? factory() : null;
}
