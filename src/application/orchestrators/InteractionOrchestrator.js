// application/orchestrators/InteractionOrchestrator.js
// Runs the "user talks to the pet" pipeline end to end:
//
//   1. GATHER   load pet + equipped clothing + memories + sensitive zones,
//               compute coverage (naked or clothed) and numeric afflictions.
//   2. ASSESS   AI call #1: which afflictions it perceives, small stat DELTAS,
//               and which memory (if any) it wants to use.
//   3. VALIDATE pure domain check: claims without numeric support are rejected,
//               deltas are whitelisted + clamped. Nothing the AI says is
//               trusted directly.
//   4. APPLY    validated deltas hit the DB atomically (transaction), then the
//               pet is re-read so the reply sees the REAL updated state.
//   5. REPLY    AI call #2 from the fresh state. Its hidden saveMemory
//               directive is consumed HERE (persisted, stripped from the
//               user-visible payload).
//
// Knows NOTHING about Firestore or Gemini — only injected port-shaped services
// plus pure domain use cases. Dependencies arrive via constructor injection.

import { computeBodyCoverage } from "../../domain/useCases/ComputeBodyCoverage.js";
import { computeAfflictions } from "../../domain/useCases/AssessPetState.js";
import {
  validateAiAssessment,
  applyApprovedDeltas,
} from "../../domain/useCases/ValidateAiAssessment.js";
import { buildMemoryIndex } from "../../domain/useCases/BuildMemoryIndex.js";
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

  async interact(petId, userMessage, context = {}) {
    if (!userMessage || typeof userMessage !== "string") {
      const err = new Error("message is required");
      err.status = 400;
      throw err;
    }

    // --- 1. Gather context ---
    const pet = await this.repo.getPet(petId);
    if (!pet) {
      const err = new Error(`Pet ${petId} not found`);
      err.status = 404;
      throw err;
    }

    const [equippedItems, memories, zones] = await Promise.all([
      this._getEquippedItems(pet),
      this.repo.getAllMemories(petId),
      this.repo.listErogenousZones(petId),
    ]);

    const coverage = computeBodyCoverage(pet.bodyParts, equippedItems);
    const afflictions = computeAfflictions(pet, { nakedParts: coverage.nakedParts });
    const memoryIndex = buildMemoryIndex(memories);
    // Only zones with any development or visible phenomena go to the prompt
    // (all ~24 catalog zones every time would waste tokens for nothing).
    const activeZones = zones.filter(
      (z) => z.isErogenous || z.developedSensitivity > 0 || (z.physicalDetails?.length ?? 0) > 0
    );

    // --- 2. AI assessment (a PROPOSAL, not truth) ---
    const assessment = await this.ia.assessInteraction(
      pet,
      { coverage: coverage.coverage, afflictions, memoryIndex },
      userMessage,
      context
    );

    // --- 3. Numeric validation: reject what the numbers don't support ---
    const validation = validateAiAssessment(pet, afflictions, assessment);
    const usedMemory = validation.usedMemoryId
      ? memoryIndex.find((m) => m.id === validation.usedMemoryId) ?? null
      : null;

    // --- 4. Apply validated deltas atomically, then re-read the clean doc ---
    // (runPetTransaction's return mixes dot-notation keys into the object, so
    // the reply prompt needs a fresh read to see properly nested state.)
    let updatedPet = pet;
    if (Object.keys(validation.approvedDeltas).length > 0) {
      await this.repo.runPetTransaction(petId, (current) =>
        applyApprovedDeltas(current, validation.approvedDeltas)
      );
      updatedPet = await this.repo.getPet(petId);
    }

    // --- 5. Reply from the UPDATED state; consume hidden directives ---
    const reply = await this.ia.respondInteraction(
      updatedPet,
      {
        coverage: coverage.coverage,
        afflictions: validation.approvedAfflictions,
        usedMemory,
        activeZones,
      },
      userMessage,
      context
    );

    const savedMemory = reply.saveMemory
      ? await this._saveMemory(petId, reply.saveMemory)
      : null;

    const thought = createThought({
      emotion: reply.emotion,
      message: reply.message,
      intensity: reply.intensity,
    });

    await Promise.all([
      this.repo.updatePetFields(petId, {
        lastThought: thought,
        updatedAt: new Date().toISOString(),
      }),
      this.repo.addEventLogEntry(
        petId,
        createEventLogEntry("speak", "user", "said", reply.gazeTarget, {
          userMessage,
          emotion: reply.emotion,
          memoryUsedId: usedMemory?.id ?? null,
          memorySaved: Boolean(savedMemory),
        })
      ),
    ]);

    // Visible payload ONLY — the hidden saveMemory content stays server-side.
    return {
      thought,
      gazeTarget: reply.gazeTarget,
      afflictions: validation.approvedAfflictions,
      rejectedAfflictions: validation.rejectedAfflictions,
      memoryUsedId: usedMemory?.id ?? null,
      memorySaved: Boolean(savedMemory),
      state: {
        neuroState: updatedPet.neuroState,
        physicalState: updatedPet.physicalState,
        arousalState: updatedPet.arousalState ?? null,
        nakedParts: coverage.nakedParts,
        isFullyNaked: coverage.isFullyNaked,
      },
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
