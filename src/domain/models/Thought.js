// domain/models/Thought.js
export function createThought({
  id = null,
  emotion = "neutral",
  message = "",
  intensity = 0.5,
  suggestedActions = [],
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    emotion,
    message,
    intensity,
    suggestedActions,
    createdAt,
  };
}