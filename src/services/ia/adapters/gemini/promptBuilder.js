// services/ia/adapters/gemini/promptBuilder.js
// Turns a Pet's raw state into prompts. This is the "translation layer" between
// the 0..1 neuro numbers and natural-language instructions for the model.
// Edit personality/interpretation rules HERE without touching the SDK or parser.

// How to read each neurotransmitter (per the Lövheim-based design).
const NEURO_GUIDE = `
Interpret these 0.00-1.00 levels:
- dopamine: low = apathetic/bored, high = motivated/excited
- serotonin: low = irritable/depressive, high = calm/stable
- oxytocin: low = detached, high = affectionate/attached to the user
- cortisol: high = stressed (hunger, cold, neglect)
- endorphins: high = energized / pain being masked
- melatonin: high = sleepy
- adrenaline: high = startled / on edge
`.trim();

// A compact, token-cheap snapshot of the pet for the model.
function describeState(pet) {
  return JSON.stringify({
    name: pet.name,
    personality: pet.personalityId ?? "unknown",
    neuro: pet.neuroState,
    physical: {
      bloodGlucose: pet.physicalState?.bloodGlucose,
      hydration: pet.physicalState?.hydration,
      coreTemperature: pet.physicalState?.coreTemperature,
      cnsFatigue: pet.physicalState?.cnsFatigue,
    },
    isAsleep: pet.isAsleep,
  });
}

// Shared instruction that pins the output shape (matches the Thought model).
const OUTPUT_CONTRACT = `
Reply ONLY with a JSON object, no markdown, in this exact shape:
{
  "emotion": string,            // one dominant emotion word
  "message": string,           // short first-person line the pet expresses
  "intensity": number,         // 0.0 to 1.0
  "suggestedActions": string[] // e.g. ["eat","sleep","play"]
}
`.trim();

// Prompt for an autonomous "thought" (no user message).
export function buildThinkPrompt(pet, context = {}) {
  return `
You are the mind of a virtual pet named "${pet.name}".
Stay in character for its personality at all times.

${NEURO_GUIDE}

Current state:
${describeState(pet)}

Context: ${JSON.stringify(context)}

Generate the pet's current inner thought based on the state above.
${OUTPUT_CONTRACT}
`.trim();
}

// Prompt for a reply to the user's message, still shaped by emotional state.
export function buildRespondPrompt(pet, userMessage, context = {}) {
  return `
You are the mind of a virtual pet named "${pet.name}".
Stay in character for its personality at all times.

${NEURO_GUIDE}

Current state:
${describeState(pet)}

The user says: "${userMessage}"
Context: ${JSON.stringify(context)}

Respond as the pet, colored by its current emotional state.
${OUTPUT_CONTRACT}
`.trim();
}
