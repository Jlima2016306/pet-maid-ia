// domain/models/Pet.js
import { createNeuroState } from "./NeuroState.js";
import { createPhysicalState } from "./PhysicalState.js";
import { createDefaultBodyParts } from "./BodyPart.js";

export function createPet({
  id = null,
  name = "",
  species = "creature",
  birthDate = new Date().toISOString(),
  neuroState = createNeuroState(),
  physicalState = createPhysicalState(),
  bodyParts = createDefaultBodyParts(),
  equippedItemIds = [],
  isAlive = true,
  isAsleep = false,
  lastTickAt = new Date().toISOString(),
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    name,
    species,
    birthDate,
    neuroState,
    physicalState,
    bodyParts,
    equippedItemIds,
    isAlive,
    isAsleep,
    lastTickAt,
    createdAt,
    updatedAt,
  };
}