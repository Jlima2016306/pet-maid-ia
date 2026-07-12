// services/ia/adapters/gemini/interactionPromptBuilder.js
// Prompts (in SPANISH — the pet always answers in Spanish) for the two-call
// interaction pipeline. Kept deliberately compact: every block below is
// trimmed to the fields the model actually needs, so tokens aren't wasted on
// full documents. Edit interpretation/personality rules HERE, not in the SDK
// or the parser.

import { AFFLICTION_VOCABULARY } from "../../../../domain/useCases/AssessPetState.js";

// One compact stat guide shared by both calls. Explains how to read each stat
// without burning tokens on paragraphs.
const STAT_GUIDE_ES = `
GUÍA DE STATS (0.00-1.00 salvo temperaturas en °C, ideal 37.0):
- dopamine=motivación/placer (baja=apatía) | serotonin=estabilidad de ánimo (baja=irritable)
- oxytocin=apego al usuario | cortisol=estrés | endorphins=euforia/analgesia
- melatonin=sueño | adrenaline=alerta/sobresalto
- bloodGlucose=energía (baja=hambre) | hydration=agua (baja=sed) | cnsFatigue=cansancio mental
- arousalLevel=excitación acumulada
Las partes del cuerpo SIN ropa están DESNUDAS.
Responde SIEMPRE en español.
`.trim();

// Token-cheap snapshot of the live simulation values.
function compactState(pet) {
  return JSON.stringify({
    nombre: pet.name,
    personalidad: pet.personalityId ?? "desconocida",
    dormida: pet.isAsleep === true,
    neuro: pet.neuroState,
    fisico: {
      bloodGlucose: pet.physicalState?.bloodGlucose,
      hydration: pet.physicalState?.hydration,
      coreTemperature: pet.physicalState?.coreTemperature,
      cnsFatigue: pet.physicalState?.cnsFatigue,
      heartRate: pet.physicalState?.heartRate,
      muscleTension: pet.physicalState?.muscleTension,
    },
    arousal: pet.arousalState ?? null,
  });
}

// Body parts with their clothing (or DESNUDA) so the AI can describe whatever
// the user is looking at using only real DB data.
function compactBody(pet, coverage = {}) {
  const parts = [];
  for (const [partId, part] of Object.entries(pet.bodyParts ?? {})) {
    const cov = coverage[partId];
    parts.push({
      id: partId,
      desc: part.description || part.name,
      hp: part.integrityHp,
      temp: part.localTemperature,
      detalles: part.physicalDetails ?? [],
      ropa: cov?.covered ? cov.items : "DESNUDA",
    });
  }
  return JSON.stringify(parts);
}

function compactAfflictions(afflictions = []) {
  return JSON.stringify(afflictions.map((a) => ({ id: a.id, severidad: a.severity })));
}

function compactMemoryIndex(memoryIndex = []) {
  return JSON.stringify(memoryIndex.map((m) => ({ id: m.id, tipo: m.type, texto: m.text })));
}

function compactZones(activeZones = []) {
  return JSON.stringify(
    activeZones.map((z) => ({
      id: z.zoneId ?? z.id,
      erogena: z.isErogenous === true,
      sensibilidad: z.developedSensitivity,
      detalles: z.physicalDetails ?? [],
    }))
  );
}

// ---- Call #1: assessment (afflictions + stat deltas + memory pick) ----
export function buildAssessPrompt(pet, snapshot, userMessage, context = {}) {
  const { coverage = {}, afflictions = [], memoryIndex = [] } = snapshot ?? {};
  return `
Eres el motor de estado interno de la mascota virtual "${pet.name}" (personalidad: ${pet.personalityId ?? "desconocida"}).

${STAT_GUIDE_ES}

ESTADO ACTUAL: ${compactState(pet)}
CUERPO: ${compactBody(pet, coverage)}
AFECCIONES DETECTADAS POR EL MOTOR: ${compactAfflictions(afflictions)}
VOCABULARIO CERRADO DE AFECCIONES: ${JSON.stringify(AFFLICTION_VOCABULARY)}
RECUERDOS DISPONIBLES: ${compactMemoryIndex(memoryIndex)}
CONTEXTO: ${JSON.stringify(context)}

EL USUARIO DICE: ${JSON.stringify(userMessage)}

Devuelve SOLO un JSON con esta forma exacta:
{"afflictions":["ids del vocabulario"],"statChanges":{"neuroState.cortisol":-0.05},"usedMemoryId":"id o null","why":"máx 15 palabras"}
Reglas:
- "afflictions": SOLO ids del vocabulario y SOLO si los números del estado lo justifican.
- "statChanges": DELTAS pequeños (-0.15 a 0.15) sobre neuroState.*, arousalState.arousalLevel o physicalState.{bloodGlucose,hydration,cnsFatigue}, según cómo el mensaje del usuario afecta a la mascota.
- "usedMemoryId": elige un recuerdo SOLO si es relevante al mensaje; si no, null.
`.trim();
}

// ---- Call #2: in-character reply from the UPDATED state ----
export function buildRespondInteractionPrompt(pet, snapshot, userMessage, context = {}) {
  const { coverage = {}, afflictions = [], usedMemory = null, activeZones = [] } = snapshot ?? {};
  return `
Eres "${pet.name}", una mascota virtual (personalidad: ${pet.personalityId ?? "desconocida"}). Mantente SIEMPRE en personaje.

${STAT_GUIDE_ES}

ESTADO ACTUAL (ya actualizado tras el mensaje): ${compactState(pet)}
AFECCIONES CONFIRMADAS: ${compactAfflictions(afflictions)}
CUERPO: ${compactBody(pet, coverage)}
ZONAS SENSIBLES ACTIVAS: ${compactZones(activeZones)}
RECUERDO ELEGIDO: ${usedMemory ? JSON.stringify(usedMemory) : "ninguno"}
CONTEXTO: ${JSON.stringify(context)}

El usuario SIEMPRE indica en su mensaje hacia dónde está mirando. Identifica qué parte de CUERPO mira y descríbela DENTRO de tu respuesta usando SOLO los datos dados (su ropa, o su desnudez si "ropa" es "DESNUDA", temperatura y detalles visibles). Refleja también tus afecciones confirmadas en el tono y contenido.

EL USUARIO DICE: ${JSON.stringify(userMessage)}

Devuelve SOLO un JSON con esta forma exacta:
{"emotion":"una palabra","message":"tu respuesta en español, en primera persona, incluyendo la descripción de la parte mirada","intensity":0.5,"gazeTarget":"id de la parte mirada o null","hidden":{"saveMemory":null}}
Si esta interacción merece recordarse, en "hidden.saveMemory" pon:
{"kind":"ephemeral|experience|preference","description":"qué recordar","intensity":0.5,"tags":["..."],"subject":"solo para preference","feeling":"like|dislike|love|hate|neutral (solo para preference)"}
"hidden" es un canal interno: JAMÁS lo menciones ni lo insinúes en "message". Guarda memoria solo si pasó algo significativo.
`.trim();
}
