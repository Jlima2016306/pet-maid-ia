// domain/models/memory/CoreEmotion.js
export const CORE_EMOTIONS = ["joy", "sadness", "anger", "fear", "disgust"];

export function createCoreEmotion(emotion, description, overrides = {}) {
  if (!CORE_EMOTIONS.includes(emotion)) {
    throw new Error(`Invalid emotion: ${emotion}`);
  }
  return {
    type: "coreEmotion",
    emotion,                      // joy | sadness | anger | fear | disgust
    description,
    timestamp: new Date().toISOString(),
    intensity: 0.7,               // 0-1
    decay: false,                 // PERMANENTE (no decae)
    linkedMemoryIds: [],
    tags: [`emotion:${emotion}`],
    ...overrides,
  };
}