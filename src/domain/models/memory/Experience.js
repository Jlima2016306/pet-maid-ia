// domain/models/memory/Experience.js
export function createExperience(title, description, significance = 0.7, overrides = {}) {
  return {
    type: "experience",
    title,
    description,
    significance,                 // 0-1, qué tan importante fue
    category: "event",            // "event" | "learning" | "achievement" | "failure"
    timestamp: new Date().toISOString(),
    intensity: significance,
    decay: true,                  // SEMANAS: traumas decaen lentamente
    decayRate: 0.01,              // -1% por día, ej
    linkedMemoryIds: [],
    tags: [],
    ...overrides,
  };
}

export function createTrauma(description, intensity = 0.9, overrides = {}) {
  return createExperience(`Trauma: ${description}`, description, intensity, {
    category: "trauma",
    tags: ["trauma", "negative"],
    decayRate: 0.005,             // decae más lentamente
    ...overrides,
  });
}