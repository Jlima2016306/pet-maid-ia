// domain/models/Thought.js
export function createThought({
  id = null,
  emotion = "neutral",
  message = "",
  action = "",             // narration channel (what the user sees / she feels)
  intensity = 0.5,
  suggestedActions = [],
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    emotion,
    message,
    action,
    intensity,
    suggestedActions,
    createdAt,
  };
}