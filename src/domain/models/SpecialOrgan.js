// domain/models/SpecialOrgan.js
// Complex organs that are too rich to fit the plain zone/bodyPart mold. They
// live at pets/{petId}/specialOrgans/{organId}. A pet STARTS with only the
// vagina; more can be added later. Pure shape only -- no formulas.

// Generic factory. `type` selects which detail block is attached.
export function createSpecialOrgan({
  id = null,
  organId = "",            // e.g. "vagina", "penis", "anus"
  type = "vagina",         // "vagina" | "penis" | "anus" | "prostate"
  description = "",        // free-text visual description
  details = null,          // type-specific block (see builders below)
  subParts = {},           // nested special sub-parts (e.g. clitoris)
  physicalDetails = [],    // observable phenomena, e.g. ["engorged","flushed"]
  updatedAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    organId,
    type,
    description,
    details: details ?? defaultDetailsFor(type),
    subParts,
    physicalDetails,
    updatedAt,
  };
}

// ---- Type-specific detail blocks ----

export function createVaginaDetails({
  lubrication = 0.0,       // 0..1
  ph = 4.2,                // ~3.8-4.5 healthy range
  contractions = 0.0,      // 0..1 momentary
  engorgement = 0.0,       // 0..1 vasocongestion
  elasticity = 0.5,        // 0..1
} = {}) {
  return { lubrication, ph, contractions, engorgement, elasticity };
}

// Clitoris is modeled as a SUB-PART of the vagina (per design decision).
export function createClitorisSubPart({
  sensitivity = 0.5,       // 0..1
  currentArousal = 0.0,    // 0..1 momentary
  engorgement = 0.0,       // 0..1
  isHooded = true,         // observable state
} = {}) {
  return { sensitivity, currentArousal, engorgement, isHooded };
}

export function createAnusDetails({
  tension = 0.5,           // 0..1
  elasticity = 0.4,        // 0..1
  sensitivity = 0.4,       // 0..1
} = {}) {
  return { tension, elasticity, sensitivity };
}

export function createPenisDetails({
  engorgement = 0.0,       // 0..1 (flaccid -> erect)
  sensitivity = 0.6,       // 0..1
  length = 0.0,            // relative, computed from engorgement elsewhere
} = {}) {
  return { engorgement, sensitivity, length };
}

function defaultDetailsFor(type) {
  switch (type) {
    case "vagina": return createVaginaDetails();
    case "anus":   return createAnusDetails();
    case "penis":  return createPenisDetails();
    default:       return {};
  }
}

// Convenience: a fresh vagina with a clitoris sub-part already attached.
export function createDefaultVagina() {
  return createSpecialOrgan({
    organId: "vagina",
    type: "vagina",
    subParts: { clitoris: createClitorisSubPart() },
  });
}
