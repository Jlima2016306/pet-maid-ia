// application/orchestrators/InteractionOrchestrator.js
// The AI-driven flows where the user addresses the pet directly:
//
//   interact()       "user talks to the pet" — the 5-step pipeline:
//     1. GATHER   pet + clothing + memories + zones + organs; coverage
//                 (clothed/naked per part AND per intimate zone) + numeric
//                 afflictions.
//     2. ASSESS   AI call #1: perceived afflictions, small stat DELTAS, and
//                 which memory (if any) it wants to lean on.
//     3. VALIDATE pure domain: claims without numeric support are rejected,
//                 deltas whitelisted + clamped. Nothing the AI says is
//                 trusted directly.
//     4. APPLY    validated deltas hit the DB atomically; afflictions are
//                 recomputed from the POST-update state so the reply (and the
//                 client) see current truth.
//     5. REPLY    AI call #2 from the fresh state, split in two channels:
//                 message (dialogue) + action (explicit narration of what the
//                 user sees). Its hidden saveMemory directive is consumed
//                 HERE (persisted, stripped from the visible payload).
//
//   requestUndress() "user asks her to take clothes off" — the AI decides in
//     character, grounded by a numeric disposition score; an acceptance the
//     numbers can't justify is overridden. If she agrees, the garments come
//     off atomically together with the stat deltas, then the normal reply
//     call narrates the result.
//
// Knows NOTHING about Firestore or Gemini — only injected port-shaped
// services plus pure domain use cases.

import { computeBodyCoverage } from "../../domain/useCases/ComputeBodyCoverage.js";
import { computeZoneExposure } from "../../domain/useCases/ComputeZoneExposure.js";
import { computeAfflictions } from "../../domain/useCases/AssessPetState.js";
import {
  validateAiAssessment,
  applyApprovedDeltas,
} from "../../domain/useCases/ValidateAiAssessment.js";
import {
  computeUndressDisposition,
  validateUndressDecision,
} from "../../domain/useCases/EvaluateUndressRequest.js";
import { buildMemoryIndex, findMemoryById } from "../../domain/useCases/BuildMemoryIndex.js";
import { EROGENOUS_ZONE_IDS } from "../../domain/models/erogenousZoneCatalog.js";
import { createThought } from "../../domain/models/Thought.js";
import { createEventLogEntry } from "../../domain/models/memory/EventLog.js";
import { createEphemeralMemory } from "../../domain/models/memory/EphemeralMemory.js";
import { createExperience } from "../../domain/models/memory/Experience.js";
import { createPreference } from "../../domain/models/memory/Preference.js";

export class InteractionOrchestrator {
  constructor({ repositoryService, iaService }) {
    this.repo = repositoryService;
    this.ia = iaService;
  }

  // ------------------------------------------------------------------ talk
  async interact(petId, userMessage, context = {}) {
    this._requireMessage(userMessage);
    const pet = await this._requirePet(petId);
    const ctx = await this._gather(pet);

    // --- 2. AI assessment (a PROPOSAL, not truth) ---
    const assessment = await this.ia.assessInteraction(
      pet,
      { coverage: ctx.coverage.coverage, afflictions: ctx.afflictions, memoryIndex: ctx.memoryIndex },
      userMessage,
      context
    );

    // --- 3. Numeric validation: reject what the numbers don't support ---
    const validation = validateAiAssessment(pet, ctx.afflictions, assessment);
    const usedMemory = findMemoryById(ctx.memories, validation.usedMemoryId);

    // --- 4. Apply validated deltas atomically (returns the clean fresh doc) ---
    let updatedPet = pet;
    if (Object.keys(validation.approvedDeltas).length > 0) {
      updatedPet = await this.repo.runPetTransaction(petId, (current) =>
        applyApprovedDeltas(current, validation.approvedDeltas)
      );
    }

    // Afflictions recomputed from the POST-update state: this is what the
    // reply prompt sees and what the client receives.
    const postAfflictions = computeAfflictions(updatedPet, { nakedParts: ctx.coverage.nakedParts });
    const approvedAfflictions = validateAiAssessment(updatedPet, postAfflictions, assessment).approvedAfflictions;

    // --- 5. Reply from the UPDATED state; consume hidden directives ---
    const { reply, savedMemory } = await this._replyAndPersist(petId, updatedPet, {
      coverage: ctx.coverage.coverage,
      afflictions: approvedAfflictions,
      usedMemory,
      zoneExposure: ctx.zoneExposure,
      organs: ctx.organs,
    }, userMessage, context, {
      eventType: "speak",
      action: "said",
      metadata: { memoryUsedId: usedMemory?.id ?? null },
    });

    return {
      message: reply.message,
      action: reply.action,
      emotion: reply.emotion,
      intensity: reply.intensity,
      gazeTarget: reply.gazeTarget,
      afflictions: approvedAfflictions,
      rejectedAfflictions: validation.rejectedAfflictions,
      memoryUsedId: usedMemory?.id ?? null,
      memorySaved: Boolean(savedMemory),
      state: this._publicState(updatedPet, ctx.coverage),
    };
  }

  // -------------------------------------------------- "take that off" flow
  async requestUndress(petId, userMessage, requestedItemIds = null, context = {}) {
    this._requireMessage(userMessage);
    const pet = await this._requirePet(petId);
    const ctx = await this._gather(pet);
    const equippedIds = ctx.equippedItems.map((i) => i.id);

    // Nothing to remove: skip the decision, let her react to the situation.
    if (equippedIds.length === 0) {
      const { reply, savedMemory } = await this._replyAndPersist(petId, pet, {
        coverage: ctx.coverage.coverage,
        afflictions: ctx.afflictions,
        usedMemory: null,
        zoneExposure: ctx.zoneExposure,
        organs: ctx.organs,
        recentEvent: "El usuario pide que te quites ropa, pero ya no llevas ninguna prenda puesta.",
      }, userMessage, context, {
        eventType: "action",
        action: "undress_requested",
        metadata: { accepted: false, reason: "no clothes equipped" },
      });
      return this._undressPayload(false, [], "no lleva ropa puesta", false, reply, savedMemory, pet, ctx.coverage);
    }

    // --- AI decision, grounded by the numeric disposition ---
    const disposition = computeUndressDisposition(pet);
    const decision = await this.ia.decideUndress(
      pet,
      { equippedItems: ctx.equippedItems, requestedItemIds, disposition, memoryIndex: ctx.memoryIndex },
      userMessage,
      context
    );
    const verdict = validateUndressDecision(pet, disposition, decision, equippedIds, requestedItemIds);

    // --- Apply: garments off + stat deltas in ONE atomic transaction ---
    const remaining = verdict.accepts
      ? equippedIds.filter((id) => !verdict.itemIds.includes(id))
      : equippedIds;

    let updatedPet = pet;
    const hasChanges = verdict.accepts || Object.keys(verdict.approvedDeltas).length > 0;
    if (hasChanges) {
      updatedPet = await this.repo.runPetTransaction(petId, (current) => ({
        ...applyApprovedDeltas(current, verdict.approvedDeltas),
        ...(verdict.accepts
          ? { equippedItemIds: remaining, updatedAt: new Date().toISOString() }
          : {}),
      }));
    }

    // Recompute the wardrobe view from what she is wearing NOW.
    const remainingItems = ctx.equippedItems.filter((i) => remaining.includes(i.id));
    const coverage = computeBodyCoverage(updatedPet.bodyParts, remainingItems);
    const zoneExposure = computeZoneExposure(ctx.zones, remainingItems);
    const postAfflictions = computeAfflictions(updatedPet, { nakedParts: coverage.nakedParts });

    const removedNames = ctx.equippedItems
      .filter((i) => verdict.itemIds.includes(i.id))
      .map((i) => i.name);
    const recentEvent = verdict.accepts
      ? `Acabas de aceptar la petición del usuario y te has quitado: ${removedNames.join(", ")}.`
      : `Te has negado a quitarte la ropa que el usuario pedía${verdict.overridden ? " (tu estado interno no lo permite)" : ""}. Motivo interno: ${verdict.reason || "no querías"}.`;

    const { reply, savedMemory } = await this._replyAndPersist(petId, updatedPet, {
      coverage: coverage.coverage,
      afflictions: postAfflictions,
      usedMemory: null,
      zoneExposure,
      organs: ctx.organs,
      recentEvent,
    }, userMessage, context, {
      eventType: "action",
      action: "undress_requested",
      metadata: {
        accepted: verdict.accepts,
        removedItemIds: verdict.itemIds,
        overridden: verdict.overridden,
        disposition: disposition.score,
      },
    });

    return this._undressPayload(
      verdict.accepts, verdict.itemIds, verdict.reason, verdict.overridden,
      reply, savedMemory, updatedPet, coverage
    );
  }

  // ------------------------------------------------------------- internals

  _requireMessage(userMessage) {
    if (!userMessage || typeof userMessage !== "string") {
      const err = new Error("message is required");
      err.status = 400;
      throw err;
    }
  }

  async _requirePet(petId) {
    const pet = await this.repo.getPet(petId);
    if (!pet) {
      const err = new Error(`Pet ${petId} not found`);
      err.status = 404;
      throw err;
    }
    return pet;
  }

  // Load everything the prompts need, in parallel.
  async _gather(pet) {
    const [equippedItems, memories, zones, organs] = await Promise.all([
      this._getEquippedItems(pet),
      this.repo.getAllMemories(pet.id),
      this.repo.listErogenousZones(pet.id),
      this.repo.listSpecialOrgans(pet.id),
    ]);

    const coverage = computeBodyCoverage(pet.bodyParts, equippedItems);

    return {
      equippedItems,
      memories,
      zones,
      organs,
      coverage,
      zoneExposure: computeZoneExposure(zones, equippedItems),
      afflictions: computeAfflictions(pet, { nakedParts: coverage.nakedParts }),
      memoryIndex: buildMemoryIndex(memories),
    };
  }

  // Reply call + hidden-directive consumption + persistence (lastThought,
  // event log). Shared by interact() and requestUndress().
  async _replyAndPersist(petId, pet, snapshot, userMessage, context, eventInfo) {
    const reply = await this.ia.respondInteraction(pet, snapshot, userMessage, context);

    // gazeTarget must be a real body part, zone or organ id — otherwise null.
    reply.gazeTarget = this._validGazeTarget(reply.gazeTarget, pet, snapshot.organs ?? []);

    const savedMemory = reply.saveMemory
      ? await this._saveMemory(petId, reply.saveMemory)
      : null;

    const thought = createThought({
      emotion: reply.emotion,
      message: reply.message,
      action: reply.action,
      intensity: reply.intensity,
    });

    await Promise.all([
      this.repo.updatePetFields(petId, {
        lastThought: thought,
        updatedAt: new Date().toISOString(),
      }),
      this.repo.addEventLogEntry(
        petId,
        createEventLogEntry(eventInfo.eventType, "user", eventInfo.action, reply.gazeTarget, {
          userMessage,
          emotion: reply.emotion,
          memorySaved: Boolean(savedMemory),
          ...eventInfo.metadata,
        })
      ),
    ]);

    return { reply, savedMemory };
  }

  _validGazeTarget(gazeTarget, pet, organs) {
    if (!gazeTarget || typeof gazeTarget !== "string") return null;
    const valid =
      (pet.bodyParts && gazeTarget in pet.bodyParts) ||
      EROGENOUS_ZONE_IDS.includes(gazeTarget) ||
      organs.some((o) => (o.organId ?? o.id) === gazeTarget);
    return valid ? gazeTarget : null;
  }

  _publicState(pet, coverage) {
    return {
      neuroState: pet.neuroState,
      physicalState: pet.physicalState,
      arousalState: pet.arousalState ?? null,
      equippedItemIds: pet.equippedItemIds ?? [],
      nakedParts: coverage.nakedParts,
      isFullyNaked: coverage.isFullyNaked,
    };
  }

  _undressPayload(accepted, removedItemIds, reason, overridden, reply, savedMemory, pet, coverage) {
    return {
      accepted,
      removedItemIds,
      reason,
      overridden,
      message: reply.message,
      action: reply.action,
      emotion: reply.emotion,
      intensity: reply.intensity,
      gazeTarget: reply.gazeTarget,
      memorySaved: Boolean(savedMemory),
      state: this._publicState(pet, coverage),
    };
  }

  // Resolve the pet's equippedItemIds against the clothing catalog. Unknown
  // ids are dropped silently (the part just counts as uncovered).
  async _getEquippedItems(pet) {
    const ids = Array.isArray(pet.equippedItemIds) ? pet.equippedItemIds : [];
    if (ids.length === 0) return [];
    const items = await Promise.all(ids.map((id) => this.repo.getClothingItem(id)));
    return items.filter(Boolean);
  }

  // Persist the hidden saveMemory directive via the matching domain factory.
  async _saveMemory(petId, directive) {
    const description = String(directive.description ?? "").trim();
    if (!description) return null;

    const intensity = Math.min(1, Math.max(0, Number(directive.intensity) || 0.5));
    const tags = Array.isArray(directive.tags) ? directive.tags.map(String) : [];

    switch (directive.kind) {
      case "experience":
        return this.repo.addExperience(
          petId,
          createExperience(description.slice(0, 60), description, intensity, { tags })
        );
      case "preference": {
        const subject = directive.subject || "interaction";
        const feeling = directive.feeling || "like";
        return this.repo.addPreference(
          petId,
          createPreference(subject, feeling, description, "", {
            intensity,
            tags: [`preference:${subject}`, `feeling:${feeling}`, ...tags],
          })
        );
      }
      case "ephemeral":
      default:
        return this.repo.addEphemeralMemory(
          petId,
          createEphemeralMemory(description, intensity, 120, { tags: ["ephemeral", ...tags] })
        );
    }
  }
}
