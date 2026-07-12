// domain/models/memory/PersonMemory.js
export function createPersonMemory(personId, name, relationship, details = {}, overrides = {}) {
  return {
    type: "person",
    personId,                     // user ID o NPC ID
    name,
    relationship,                 // "master" | "friend" | "stranger" | "enemy" | etc
    details: {
      firstMeetAt: null,
      likes: [],                  // "scratches behind ears", "talks softly"
      dislikes: [],               // "loud noises", "ignoring"
      relationshipHistory: [],    // [{timestamp, event, delta}]
      trustLevel: 0.5,            // 0-1
      affectionLevel: 0.5,        // 0-1
      ...details,
    },
    timestamp: new Date().toISOString(),
    intensity: 0.8,
    decay: false,                 // AÑOS: personas son long-lived
    linkedMemoryIds: [],
    tags: [`person:${personId}`, `relationship:${relationship}`],
    ...overrides,
  };
}