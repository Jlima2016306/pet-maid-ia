// domain/useCases/AssessPetState.js
// PURE logic. Computes the pet's current afflictions NUMERICALLY from its raw
// state. This list is the GROUND TRUTH used to validate whatever the AI claims
// (step 4 of the interaction pipeline): an affliction the AI names is only
// accepted if it also appears here. No DB, no IA in this file.

// Linear severity ramp: 0 at `start`, 1 at `end`. Works in both directions
// (start > end models "lower value = worse", e.g. hunger from glucose).
function ramp(value, start, end) {
  if (typeof value !== "number" || Number.isNaN(value) || start === end) return 0;
  const t = (value - start) / (end - start);
  return Math.min(1, Math.max(0, t));
}

// Worst (lowest-HP) body part, for the pain affliction.
function worstInjuredPart(bodyParts = {}) {
  let worst = null;
  for (const [partId, part] of Object.entries(bodyParts)) {
    const hp = part?.integrityHp ?? 100;
    if (!worst || hp < worst.hp) worst = { partId, hp };
  }
  return worst;
}

// Coldest NAKED part, for surface cold (clothes insulate covered parts).
function coldestNakedPart(bodyParts = {}, nakedParts = []) {
  let coldest = null;
  for (const partId of nakedParts) {
    const temp = bodyParts[partId]?.localTemperature;
    if (typeof temp !== "number") continue;
    if (!coldest || temp < coldest.temp) coldest = { partId, temp };
  }
  return coldest;
}

// Each rule maps raw numbers to a severity 0..1 plus the evidence used, so a
// rejection ("the AI claimed X but the numbers say no") is always explainable.
// Labels are in Spanish because they are surfaced verbatim to the AI prompt.
const AFFLICTION_RULES = [
  {
    id: "hambre",
    label: "Hambre",
    evaluate: (pet) => {
      const v = pet.physicalState?.bloodGlucose;
      return { severity: ramp(v, 0.35, 0.05), evidence: { stat: "physicalState.bloodGlucose", value: v } };
    },
  },
  {
    id: "deshidratacion",
    label: "Deshidratación",
    evaluate: (pet) => {
      const v = pet.physicalState?.hydration;
      return { severity: ramp(v, 0.45, 0.1), evidence: { stat: "physicalState.hydration", value: v } };
    },
  },
  {
    id: "hipotermia",
    label: "Hipotermia",
    evaluate: (pet) => {
      const v = pet.physicalState?.coreTemperature;
      return { severity: ramp(v, 36.2, 34.5), evidence: { stat: "physicalState.coreTemperature", value: v } };
    },
  },
  {
    id: "fiebre",
    label: "Fiebre",
    evaluate: (pet) => {
      const v = pet.physicalState?.coreTemperature;
      return { severity: ramp(v, 37.6, 39.5), evidence: { stat: "physicalState.coreTemperature", value: v } };
    },
  },
  {
    id: "agotamiento",
    label: "Agotamiento",
    evaluate: (pet) => {
      const v = pet.physicalState?.cnsFatigue;
      return { severity: ramp(v, 0.6, 0.95), evidence: { stat: "physicalState.cnsFatigue", value: v } };
    },
  },
  {
    id: "somnolencia",
    label: "Somnolencia",
    evaluate: (pet) => {
      const v = pet.neuroState?.melatonin;
      return { severity: ramp(v, 0.6, 0.95), evidence: { stat: "neuroState.melatonin", value: v } };
    },
  },
  {
    id: "estres",
    label: "Estrés",
    evaluate: (pet) => {
      const v = pet.neuroState?.cortisol;
      return { severity: ramp(v, 0.55, 0.9), evidence: { stat: "neuroState.cortisol", value: v } };
    },
  },
  {
    id: "ansiedad",
    label: "Ansiedad / alerta",
    evaluate: (pet) => {
      const v = pet.neuroState?.adrenaline;
      return { severity: ramp(v, 0.5, 0.9), evidence: { stat: "neuroState.adrenaline", value: v } };
    },
  },
  {
    id: "apatia",
    label: "Apatía",
    evaluate: (pet) => {
      const v = pet.neuroState?.dopamine;
      return { severity: ramp(v, 0.35, 0.05), evidence: { stat: "neuroState.dopamine", value: v } };
    },
  },
  {
    id: "irritabilidad",
    label: "Irritabilidad",
    evaluate: (pet) => {
      const v = pet.neuroState?.serotonin;
      return { severity: ramp(v, 0.35, 0.05), evidence: { stat: "neuroState.serotonin", value: v } };
    },
  },
  {
    id: "soledad",
    label: "Soledad / desapego",
    evaluate: (pet) => {
      const v = pet.neuroState?.oxytocin;
      return { severity: ramp(v, 0.3, 0.05), evidence: { stat: "neuroState.oxytocin", value: v } };
    },
  },
  {
    id: "dolor",
    label: "Dolor",
    evaluate: (pet) => {
      const worst = worstInjuredPart(pet.bodyParts);
      if (!worst) return { severity: 0, evidence: null };
      return {
        severity: ramp(worst.hp, 60, 10),
        evidence: { stat: `bodyParts.${worst.partId}.integrityHp`, value: worst.hp },
      };
    },
  },
  {
    id: "excitacion",
    label: "Excitación",
    evaluate: (pet) => {
      const v = pet.arousalState?.arousalLevel;
      return { severity: ramp(v, 0.4, 0.9), evidence: { stat: "arousalState.arousalLevel", value: v } };
    },
  },
  {
    id: "frio_superficial",
    label: "Frío en la piel expuesta",
    evaluate: (pet, { nakedParts = [] } = {}) => {
      const coldest = coldestNakedPart(pet.bodyParts, nakedParts);
      if (!coldest) return { severity: 0, evidence: null };
      return {
        severity: ramp(coldest.temp, 35.5, 33),
        evidence: { stat: `bodyParts.${coldest.partId}.localTemperature`, value: coldest.temp },
      };
    },
  },
];

// Closed vocabulary the AI must pick from (anything else is auto-rejected).
export const AFFLICTION_VOCABULARY = AFFLICTION_RULES.map((r) => r.id);

// Severity at/above which an affliction is "critical": it is surfaced to the
// reply prompt even if the AI's assessment failed to mention it.
export const CRITICAL_SEVERITY = 0.6;

// Returns [{ id, label, severity, evidence }] sorted worst-first. Only
// afflictions with severity > 0 are included. `nakedParts` comes from
// computeBodyCoverage (clothing shields covered skin from surface cold).
export function computeAfflictions(pet, { nakedParts = [] } = {}) {
  const found = [];
  for (const rule of AFFLICTION_RULES) {
    const { severity, evidence } = rule.evaluate(pet, { nakedParts });
    if (severity > 0) {
      found.push({ id: rule.id, label: rule.label, severity: Number(severity.toFixed(2)), evidence });
    }
  }
  return found.sort((a, b) => b.severity - a.severity);
}
