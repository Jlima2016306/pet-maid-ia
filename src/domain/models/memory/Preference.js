// domain/models/memory/Preference.js
export function createPreference(subject, type, value, reason = "", overrides = {}) {
  return {
    type: "preference",
    subject,                      // "touching" | "voice tone" | "clothing" | etc
    preferenceType: type,         // "like" | "dislike" | "neutral" | "hate" | "love"
    value: value,                 // descrip o tag
    reason,
    timestamp: new Date().toISOString(),
    intensity: 0.6,
    decay: false,                 // PERMANENTE: las preferencias persisten
    linkedMemoryIds: [],
    tags: [`preference:${subject}`, `feeling:${type}`],
    ...overrides,
  };
}