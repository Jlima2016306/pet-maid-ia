// domain/presets/clothingPresets.js
// Seed data for the clothingCatalog collection. Each factory returns a
// ClothingItem whose doc id is the preset key, so seeding is an idempotent
// upsert (re-running the initializer overwrites instead of duplicating).
//
// `covers` hides whole body parts; `coversZones` hides intimate zones that
// don't map to a whole part (a bra covers the breasts, not the torso).

import { createClothingItem } from "../models/ClothingItem.js";

export const CLOTHING_PRESET_IDS = {
  STOCKINGS_BLACK: "mediasNegras",
  PANTIES_LIGHT: "bragasLigeras",
  BRA_LIGHT: "sostenLigero",
  DRESS_STRAPS: "vestidoTirantes",
};

export const clothingPresets = {
  [CLOTHING_PRESET_IDS.STOCKINGS_BLACK]: () =>
    createClothingItem({
      id: "mediasNegras",
      name: "Medias negras",
      description: "medias negras semitransparentes que suben hasta medio muslo",
      covers: ["leftLeg", "rightLeg", "leftFoot", "rightFoot"],
      coversZones: ["feet", "backOfKnees"],
      thermalInsulation: 0.15,
      physicalDefense: 0.02,
      weightGr: 60,
      slot: "inner",
    }),

  [CLOTHING_PRESET_IDS.PANTIES_LIGHT]: () =>
    createClothingItem({
      id: "bragasLigeras",
      name: "Bragas ligeras",
      description: "bragas ligeras de tela fina y suave",
      covers: [],
      coversZones: ["vulva", "labiaMajora", "labiaMinora", "perineum", "analZone", "glutes"],
      thermalInsulation: 0.05,
      physicalDefense: 0,
      weightGr: 25,
      slot: "inner",
    }),

  [CLOTHING_PRESET_IDS.BRA_LIGHT]: () =>
    createClothingItem({
      id: "sostenLigero",
      name: "Sostén ligero",
      description: "sostén ligero de tela fina, sin relleno",
      covers: [],
      coversZones: ["breasts", "nipples"],
      thermalInsulation: 0.05,
      physicalDefense: 0,
      weightGr: 30,
      slot: "inner",
    }),

  [CLOTHING_PRESET_IDS.DRESS_STRAPS]: () =>
    createClothingItem({
      id: "vestidoTirantes",
      name: "Vestido delgado de tirantes",
      description: "vestido bonito y delgado de tirantes, de tela ligera que cae hasta los muslos",
      covers: ["torso"],
      coversZones: ["breasts", "nipples", "navel", "lowerBack", "glutes", "innerThighs"],
      thermalInsulation: 0.2,
      physicalDefense: 0.05,
      weightGr: 180,
      slot: "outer",
    }),
};

// Full catalog as { itemId: item } ready to seed.
export function buildClothingCatalog() {
  const catalog = {};
  for (const [itemId, factory] of Object.entries(clothingPresets)) {
    catalog[itemId] = factory();
  }
  return catalog;
}
