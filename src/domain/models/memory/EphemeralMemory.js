// domain/models/memory/EphemeralMemory.js
export function createEphemeralMemory(description, intensity = 0.4, ttlMinutes = 120, overrides = {}) {
  return {
    type: "ephemeral",
    description,
    timestamp: new Date().toISOString(),
    intensity,
    decay: true,
    decayRate: 1 / (ttlMinutes * 60),  // decae en ttlMinutes
    expiresAt: new Date(Date.now() + ttlMinutes * 60000).toISOString(),
    linkedMemoryIds: [],
    tags: ["ephemeral"],
    ...overrides,
  };
}

// Memoria suprimida (reaparece si se toca el tema)
export function createSuppressedMemory(originalMemory, triggerTags = [], overrides = {}) {
  return {
    ...originalMemory,
    type: "suppressed",
    isSuppressed: true,
    triggerTags,                  // ["sexual", "violence"] -> reaparece si se menciona
    suppressedAt: new Date().toISOString(),
    ...overrides,
  };
}