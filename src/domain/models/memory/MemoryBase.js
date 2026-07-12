// domain/models/memory/MemoryBase.js
export function createMemoryBase(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    intensity: 0.5,              // 0-1, qué tan fuerte
    decay: true,                 // se desvanece con el tiempo?
    linkedMemoryIds: [],         // referencias a otras memorias
    tags: [],                    // #trauma, #positive, #person:userId, etc
    ...overrides,
  };
}