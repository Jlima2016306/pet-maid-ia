// services/ia/adapters/GeminiAdapter.js
// THIN assembler implementing IaPort. It only coordinates three small pieces:
//   geminiClient   -> the SDK model
//   promptBuilder  -> turns Pet state into prompts
//   thoughtParser  -> turns the reply into a Thought
// No prompt text or SDK setup lives here, so this file stays tiny. Swap Gemini
// for Claude by writing a ClaudeAdapter with the same three-piece split.

import { IaPort } from "../../../domain/ports/IaPort.js";
import { getGeminiModel } from "./gemini/geminiClient.js";
import { buildThinkPrompt, buildRespondPrompt } from "./gemini/promptBuilder.js";
import { parseThought } from "./gemini/thoughtParser.js";
import {
  buildAssessPrompt,
  buildRespondInteractionPrompt,
  buildUndressDecisionPrompt,
} from "./gemini/interactionPromptBuilder.js";
import {
  parseAssessment,
  parseInteractionReply,
  parseUndressDecision,
} from "./gemini/interactionParser.js";

export class GeminiAdapter extends IaPort {
  constructor(model = getGeminiModel()) {
    super();
    this.model = model;
  }

  // Run a prompt through the model and return the raw text reply.
  async _generate(prompt) {
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async think(pet, context = {}) {
    const prompt = buildThinkPrompt(pet, context);
    const raw = await this._generate(prompt);
    return parseThought(raw);
  }

  async respondTo(pet, userMessage, context = {}) {
    const prompt = buildRespondPrompt(pet, userMessage, context);
    const raw = await this._generate(prompt);
    return parseThought(raw);
  }

  // Interaction pipeline call #1: perceived afflictions + stat deltas + memory pick.
  async assessInteraction(pet, snapshot, userMessage, context = {}) {
    const prompt = buildAssessPrompt(pet, snapshot, userMessage, context);
    const raw = await this._generate(prompt);
    return parseAssessment(raw);
  }

  // Interaction pipeline call #2: in-character reply + hidden saveMemory directive.
  async respondInteraction(pet, snapshot, userMessage, context = {}) {
    const prompt = buildRespondInteractionPrompt(pet, snapshot, userMessage, context);
    const raw = await this._generate(prompt);
    return parseInteractionReply(raw);
  }

  // Undress-request flow: in-character yes/no decision on removing garments.
  async decideUndress(pet, snapshot, userMessage, context = {}) {
    const prompt = buildUndressDecisionPrompt(pet, snapshot, userMessage, context);
    const raw = await this._generate(prompt);
    return parseUndressDecision(raw);
  }
}
