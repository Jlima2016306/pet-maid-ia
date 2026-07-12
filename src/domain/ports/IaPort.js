// domain/ports/IaPort.js
// CONTRACT for any AI provider. Gemini, Claude, a local model... all must
// extend this class. Methods receive DOMAIN MODELS (Pet) and always return a
// Thought, so the underlying provider can be swapped in the injector without
// touching the rest of the app.

export class IaPort {
  /**
   * Reads the pet's raw neuro + physical state and produces a Thought.
   * The adapter is responsible for building the prompt that tells the model
   * how to interpret the 0..1 neuro values (per the Lövheim mapping) and for
   * parsing the model's reply into a valid Thought.
   *
   * @param {object} pet      full Pet domain model
   * @param {object} [context] optional extras (timeOfDay, recentEvents, history)
   * @returns {Promise<object>} a Thought
   */
  async think(pet, context = {}) {
    throw new Error("IaPort.think() not implemented");
  }

  /**
   * Optional: free-form conversational reply from the user's message, still
   * shaped by the pet's current emotional state. Returns a Thought.
   *
   * @param {object} pet
   * @param {string} userMessage
   * @param {object} [context]
   * @returns {Promise<object>} a Thought
   */
  async respondTo(pet, userMessage, context = {}) {
    throw new Error("IaPort.respondTo() not implemented");
  }

  /**
   * Interaction pipeline call #1: given the pet, a prepared snapshot
   * ({ coverage, afflictions, memoryIndex }) and the user's message, the AI
   * proposes which afflictions it perceives, small stat DELTAS, and which
   * memory (if any) it wants to use. The proposal is validated numerically
   * by the domain before anything is persisted.
   *
   * @param {object} pet
   * @param {object} snapshot  { coverage, afflictions, memoryIndex }
   * @param {string} userMessage
   * @param {object} [context]
   * @returns {Promise<object>} an AiAssessment (see domain/models/Interaction.js)
   */
  async assessInteraction(pet, snapshot, userMessage, context = {}) {
    throw new Error("IaPort.assessInteraction() not implemented");
  }

  /**
   * Interaction pipeline call #2: in-character reply from the ALREADY UPDATED
   * state. The snapshot carries validated afflictions, coverage, the chosen
   * memory's content and any active sensitive zones. The reply includes the
   * hidden saveMemory directive (consumed server-side, never shown to the user).
   *
   * @param {object} pet       pet AFTER validated deltas were applied
   * @param {object} snapshot  { coverage, afflictions, usedMemory, activeZones }
   * @param {string} userMessage
   * @param {object} [context]
   * @returns {Promise<object>} an InteractionReply (see domain/models/Interaction.js)
   */
  async respondInteraction(pet, snapshot, userMessage, context = {}) {
    throw new Error("IaPort.respondInteraction() not implemented");
  }
}