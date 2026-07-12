// services/db/adapters/FirestoreAdapter.js
// THIN assembler. It wires the per-domain repositories and forwards each
// RepositoryPort method to the right one. No query logic lives here anymore,
// so this file stays short and you edit the small repo files instead.
//
//   PetRepository        -> pets/{petId}  (brain/neuro/physical/bodyParts + tx)
//   HabitRepository      -> pets/{petId}/habits
//   TaskRepository       -> pets/{petId}/tasks
//   StatisticRepository  -> pets/{petId}/statistics
//   ClothingRepository   -> clothingCatalog

import { RepositoryPort } from "../../../domain/ports/RepositoryPort.js";
import { getFirestore } from "../../../infrastructure/config/firebase.config.js";

import { PetRepository } from "./repositories/PetRepository.js";
import { HabitRepository } from "./repositories/HabitRepository.js";
import { TaskRepository } from "./repositories/TaskRepository.js";
import { StatisticRepository } from "./repositories/StatisticRepository.js";
import { ClothingRepository } from "./repositories/ClothingRepository.js";
import { MemoryRepository } from "./repositories/MemoryRepository.js";
import { BodyRepository } from "./repositories/BodyRepository.js";

export class FirestoreAdapter extends RepositoryPort {
  constructor(db = getFirestore()) {
    super();
    this.db = db;
    const petsCol = db.collection("pets");
    const clothingCol = db.collection("clothingCatalog");

    this.petRepo = new PetRepository(petsCol, db);
    this.habitRepo = new HabitRepository(petsCol);
    this.taskRepo = new TaskRepository(petsCol);
    this.statRepo = new StatisticRepository(petsCol);
    this.clothingRepo = new ClothingRepository(clothingCol);
    this.memoryRepo = new MemoryRepository(db);
    this.bodyRepo = new BodyRepository(petsCol);
  }

  // ---------- Pet ----------
  createPet(pet) { return this.petRepo.create(pet); }
  getPetById(petId) { return this.petRepo.getById(petId); }
  petExists(petId) { return this.petRepo.exists(petId); }
  savePet(pet) { return this.petRepo.save(pet); }
  updatePetFields(petId, fields) { return this.petRepo.updateFields(petId, fields); }
  runPetTransaction(petId, mutatorFn) { return this.petRepo.runTransaction(petId, mutatorFn); }

  // deletePet also clears subcollections (Firestore has no cascade).
  async deletePet(petId) {
    const [habits, tasks, stats] = await Promise.all([
      this.habitRepo.list(petId),
      this.taskRepo.list(petId),
      this.statRepo.list(petId, 500),
    ]);
    await Promise.all([
      ...habits.map((h) => this.habitRepo.remove(petId, h.id)),
      ...tasks.map((t) => this.taskRepo.remove(petId, t.id)),
    ]);
    // statistics have no single-delete in the repo; wipe via batch here
    const statsCol = this.db.collection("pets").doc(petId).collection("statistics");
    const snap = await statsCol.get();
    if (!snap.empty) {
      const batch = this.db.batch();
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return this.petRepo.delete(petId);
  }

  // ---------- Habits ----------
  addHabit(petId, habit) { return this.habitRepo.add(petId, habit); }
  listHabits(petId) { return this.habitRepo.list(petId); }
  updateHabit(petId, habit) { return this.habitRepo.update(petId, habit); }

  // ---------- Tasks ----------
  addTask(petId, task) { return this.taskRepo.add(petId, task); }
  listTasks(petId) { return this.taskRepo.list(petId); }
  updateTask(petId, task) { return this.taskRepo.update(petId, task); }

  // ---------- Statistics ----------
  addStatistic(petId, statistic) { return this.statRepo.add(petId, statistic); }
  listStatistics(petId, limit = 50) { return this.statRepo.list(petId, limit); }

  // ---------- Clothing ----------
  getClothingItem(itemId) { return this.clothingRepo.getById(itemId); }
  listClothingItems() { return this.clothingRepo.list(); }

  // ---------- Body subcollections ----------
  setSpecialOrgan(petId, organId, organ) { return this.bodyRepo.setSpecialOrgan(petId, organId, organ); }
  listSpecialOrgans(petId) { return this.bodyRepo.listSpecialOrgans(petId); }
  setErogenousZone(petId, zoneId, zone) { return this.bodyRepo.setErogenousZone(petId, zoneId, zone); }
  listErogenousZones(petId) { return this.bodyRepo.listErogenousZones(petId); }

  // ---------- Memories ----------
  addCoreEmotion(petId, emotion) { return this.memoryRepo.addCoreEmotion(petId, emotion); }
  getCoreEmotions(petId) { return this.memoryRepo.getCoreEmotions(petId); }

  addPersonMemory(petId, personMemory) { return this.memoryRepo.addPersonMemory(petId, personMemory); }
  getPersonMemories(petId) { return this.memoryRepo.getPersonMemories(petId); }
  getPersonMemory(petId, personId) { return this.memoryRepo.getPersonMemory(petId, personId); }

  addExperience(petId, experience) { return this.memoryRepo.addExperience(petId, experience); }
  getExperiences(petId) { return this.memoryRepo.getExperiences(petId); }

  addPreference(petId, preference) { return this.memoryRepo.addPreference(petId, preference); }
  getPreferences(petId) { return this.memoryRepo.getPreferences(petId); }

  addEphemeralMemory(petId, ephemeralMemory) { return this.memoryRepo.addEphemeralMemory(petId, ephemeralMemory); }
  getEphemeralMemories(petId) { return this.memoryRepo.getEphemeralMemories(petId); }

  addEventLogEntry(petId, logEntry) { return this.memoryRepo.addEventLogEntry(petId, logEntry); }
  getEventLog(petId, limit = 100) { return this.memoryRepo.getEventLog(petId, limit); }

  getAllMemories(petId, type = null) { return this.memoryRepo.getAllMemories(petId, type); }
  updateMemory(petId, memoryType, memoryId, updates) { return this.memoryRepo.updateMemory(petId, memoryType, memoryId, updates); }
  deleteMemory(petId, memoryType, memoryId) { return this.memoryRepo.deleteMemory(petId, memoryType, memoryId); }
}
