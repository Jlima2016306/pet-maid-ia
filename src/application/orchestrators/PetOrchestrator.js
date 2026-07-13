// application/orchestrators/PetOrchestrator.js
// Coordinates the services (db + ia) and the pure use cases to expose the
// pet's actions. It knows NOTHING about Firestore or Gemini -- only the
// services (which are port-shaped). Dependencies are INJECTED via constructor.

import { initializePet } from "../../domain/useCases/InitializePet.js";
import { feedPet } from "../../domain/useCases/FeedPet.js";
import { playWithPet } from "../../domain/useCases/PlayWithPet.js";
import { sleepPet, wakePet } from "../../domain/useCases/SleepPet.js";

export class PetOrchestrator {
  constructor({ repositoryService, iaService }) {
    this.repo = repositoryService;
    this.ia = iaService;
  }

  // Create OR initialize a pet. Idempotent: if it already exists and is
  // seeded, presets are not overwritten (handled inside initializePet).
  // initializePet returns { pet, subcollections }: the pet document goes to
  // pets/{petId}, the subcollections (organs, zones, seed memories) are
  // written separately below.
  async createOrInitPet({ petId, name, neuroPresetId, bodyPresetId }) {
    const existingPet = petId ? await this.repo.getPet(petId) : null;
    const { pet, subcollections } = initializePet({ existingPet, name, neuroPresetId, bodyPresetId });

    const saved = existingPet
      ? await this.repo.savePet(pet)
      : await this.repo.createPet(petId ? { ...pet, id: petId } : pet);

    await this._seedSubcollections(saved.id, subcollections);
    return saved;
  }

  // Write the seed payload produced by initializePet. Organs/zones use their
  // id as doc id (idempotent upsert); memories are add-only but initializePet
  // only emits them on first seeding, so re-init doesn't duplicate them.
  async _seedSubcollections(petId, sub = {}) {
    const writes = [];
    for (const [organId, organ] of Object.entries(sub.specialOrgans ?? {})) {
      writes.push(this.repo.setSpecialOrgan(petId, organId, organ));
    }
    for (const [zoneId, zone] of Object.entries(sub.erogenousZones ?? {})) {
      writes.push(this.repo.setErogenousZone(petId, zoneId, zone));
    }
    for (const emotion of sub.coreEmotions ?? []) {
      writes.push(this.repo.addCoreEmotion(petId, emotion));
    }
    for (const preference of sub.preferences ?? []) {
      writes.push(this.repo.addPreference(petId, preference));
    }
    for (const experience of sub.experiences ?? []) {
      writes.push(this.repo.addExperience(petId, experience));
    }
    for (const person of sub.personMemories ?? []) {
      writes.push(this.repo.addPersonMemory(petId, person));
    }
    await Promise.all(writes);
  }

  async getPet(petId) {
    return this.repo.getPet(petId);
  }

  // --- Actions: each runs its pure use case inside an atomic transaction ---

  async feed(petId, nutrition) {
    return this.repo.runPetTransaction(petId, (pet) => feedPet(pet, nutrition));
  }

  async play(petId, intensity) {
    return this.repo.runPetTransaction(petId, (pet) => playWithPet(pet, intensity));
  }

  async sleep(petId, hours) {
    return this.repo.runPetTransaction(petId, (pet) => sleepPet(pet, hours));
  }

  async wake(petId) {
    return this.repo.updatePetFields(petId, wakePet());
  }

  // --- AI: the pet "thinks" from its current state ---
  async think(petId, context = {}) {
    const pet = await this.repo.getPet(petId);
    if (!pet) throw new Error(`Pet ${petId} not found`);
    const thought = await this.ia.think(pet, context);
    // persist last thought on the pet for quick reads
    await this.repo.updatePetFields(petId, {
      lastThought: thought,
      updatedAt: new Date().toISOString(),
    });
    return thought;
  }

  // --- AI: the pet replies to the user, colored by emotional state ---
  async talk(petId, userMessage, context = {}) {
    const pet = await this.repo.getPet(petId);
    if (!pet) throw new Error(`Pet ${petId} not found`);
    const thought = await this.ia.respondTo(pet, userMessage, context);
    await this.repo.updatePetFields(petId, {
      lastThought: thought,
      updatedAt: new Date().toISOString(),
    });
    return thought;
  }
}
