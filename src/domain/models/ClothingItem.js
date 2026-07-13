// domain/models/ClothingItem.js
// SEPARATE catalog collection: clothingCatalog/{itemId}
//
// FIRESTORE DESIGN DECISION (replaces the SQL Many-to-Many table):
// SQL used 3 tables (Clothing_Items, Body_Parts, Body_Coverage junction).
// In Firestore we do NOT need a junction collection. Instead each garment
// declares which parts it covers via the `covers` array. The pet stores only
// equippedItemIds. To know "what covers the left arm", filter equipped items
// where covers includes "leftArm". This keeps it denormalized, fast, and
// avoids extra reads.

import { BODY_PART_IDS } from "./BodyPart.js";
import { EROGENOUS_ZONE_IDS } from "./erogenousZoneCatalog.js";

export function createClothingItem({
  id = null,
  name = "",
  description = "",         // visual text the AI uses to describe the garment
  covers = [],              // array<string> of BODY_PART_IDS, e.g. ["torso","leftArm","rightArm"]
  coversZones = [],         // array<string> of EROGENOUS_ZONE_IDS the garment hides
                            // (e.g. a bra covers ["breasts","nipples"] without
                            //  covering any whole body part)
  thermalInsulation = 0,    // 0..1. Helps retain localTemperature of covered parts
  physicalDefense = 0,      // 0..1. Reduces incoming damage to covered parts
  weightGr = 0,             // affects energy spent when moving
  slot = "outer",          // layering slot: "inner" | "outer" | "accessory"
} = {}) {
  return {
    id,
    name,
    description,
    covers,
    coversZones,
    thermalInsulation,
    physicalDefense,
    weightGr,
    slot,
  };
}

// Validate that every covered part is a real body part id.
export function isValidCoverage(covers) {
  return Array.isArray(covers) && covers.every((p) => BODY_PART_IDS.includes(p));
}

// Validate that every covered zone is a real catalog zone id.
export function isValidZoneCoverage(coversZones) {
  return Array.isArray(coversZones) && coversZones.every((z) => EROGENOUS_ZONE_IDS.includes(z));
}

// Example catalog document:
// clothingCatalog/leatherJacket01 {
//   name: "Leather Jacket",
//   covers: ["torso", "leftArm", "rightArm"],
//   thermalInsulation: 0.6,
//   physicalDefense: 0.4,
//   weightGr: 1200,
//   slot: "outer"
// }
