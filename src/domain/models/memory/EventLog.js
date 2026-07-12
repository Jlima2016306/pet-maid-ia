// domain/models/memory/EventLog.js
export function createEventLogEntry(eventType, actor, action, target = null, metadata = {}, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType,                    // "touch" | "speak" | "action" | "state_change"
    actor,                        // "user" | "pet" | "system"
    action,                       // "scratched" | "said" | etc
    target,                       // body part, zone, etc
    metadata,                     // arbitrario
    ...overrides,
  };
}