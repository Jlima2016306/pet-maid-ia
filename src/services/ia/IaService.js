// services/ia/IaService.js
// Wraps ANY adapter that implements IaPort (Gemini, Claude, fake...).
// The application layer depends on THIS service, never on a concrete adapter.
// Swapping the AI provider = passing a different adapter here.

export class IaService {
  // The adapter is injected (see injector.js). Must be an IaPort.
  constructor(adapter) {
    if (!adapter) throw new Error("IaService requires an IA adapter");
    this.adapter = adapter;
  }

  // Autonomous thought from the pet's current state -> Thought.
  think(pet, context = {}) {
    return this.adapter.think(pet, context);
  }

  // Reply to a user message, colored by emotional state -> Thought.
  respondTo(pet, userMessage, context = {}) {
    return this.adapter.respondTo(pet, userMessage, context);
  }

  // Interaction pipeline call #1 -> AiAssessment (proposal, validated later).
  assessInteraction(pet, snapshot, userMessage, context = {}) {
    return this.adapter.assessInteraction(pet, snapshot, userMessage, context);
  }

  // Interaction pipeline call #2 -> InteractionReply (with hidden directive).
  respondInteraction(pet, snapshot, userMessage, context = {}) {
    return this.adapter.respondInteraction(pet, snapshot, userMessage, context);
  }
}
