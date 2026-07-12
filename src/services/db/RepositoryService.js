// services/db/RepositoryService.js
// Wraps ANY adapter that implements RepositoryPort (Firestore, Mongo, fake...).
// The application layer depends on THIS service, never on a concrete adapter.
// The service adds nothing DB-specific: it just guarantees the app talks to a
// stable, port-shaped API. Swapping the DB = passing a different adapter here.

export class RepositoryService {
  // The adapter is injected (see injector.js). Must be a RepositoryPort.
  constructor(adapter) {
    if (!adapter) throw new Error("RepositoryService requires a repository adapter");
    this.adapter = adapter;
  }

  // ---------- Pet ----------
  createPet(pet) { return this.adapter.createPet(pet); }
  getPet(petId) { return this.adapter.getPetById(petId); }
  petExists(petId) { return this.adapter.petExists(petId); }
  savePet(pet) { return this.adapter.savePet(pet); }
  updatePetFields(petId, fields) { return this.adapter.updatePetFields(petId, fields); }
  deletePet(petId) { return this.adapter.deletePet(petId); }
  runPetTransaction(petId, mutatorFn) { return this.adapter.runPetTransaction(petId, mutatorFn); }

  // ---------- Habits ----------
  addHabit(petId, habit) { return this.adapter.addHabit(petId, habit); }
  listHabits(petId) { return this.adapter.listHabits(petId); }
  updateHabit(petId, habit) { return this.adapter.updateHabit(petId, habit); }

  // ---------- Tasks ----------
  addTask(petId, task) { return this.adapter.addTask(petId, task); }
  listTasks(petId) { return this.adapter.listTasks(petId); }
  updateTask(petId, task) { return this.adapter.updateTask(petId, task); }

  // ---------- Statistics ----------
  addStatistic(petId, statistic) { return this.adapter.addStatistic(petId, statistic); }
  listStatistics(petId, limit = 50) { return this.adapter.listStatistics(petId, limit); }

  // ---------- Clothing ----------
  getClothingItem(itemId) { return this.adapter.getClothingItem(itemId); }
  listClothingItems() { return this.adapter.listClothingItems(); }

  // ---------- Body subcollections ----------
  setSpecialOrgan(petId, organId, organ) { return this.adapter.setSpecialOrgan(petId, organId, organ); }
  listSpecialOrgans(petId) { return this.adapter.listSpecialOrgans(petId); }
  setErogenousZone(petId, zoneId, zone) { return this.adapter.setErogenousZone(petId, zoneId, zone); }
  listErogenousZones(petId) { return this.adapter.listErogenousZones(petId); }

  // ---------- Memories ----------
  addCoreEmotion(petId, emotion) { return this.adapter.addCoreEmotion(petId, emotion); }
  getCoreEmotions(petId) { return this.adapter.getCoreEmotions(petId); }
  addPersonMemory(petId, personMemory) { return this.adapter.addPersonMemory(petId, personMemory); }
  getPersonMemories(petId) { return this.adapter.getPersonMemories(petId); }
  addExperience(petId, experience) { return this.adapter.addExperience(petId, experience); }
  addPreference(petId, preference) { return this.adapter.addPreference(petId, preference); }
  addEphemeralMemory(petId, ephemeralMemory) { return this.adapter.addEphemeralMemory(petId, ephemeralMemory); }
  getAllMemories(petId, type = null) { return this.adapter.getAllMemories(petId, type); }
  updateMemory(petId, memoryType, memoryId, updates) { return this.adapter.updateMemory(petId, memoryType, memoryId, updates); }
  deleteMemory(petId, memoryType, memoryId) { return this.adapter.deleteMemory(petId, memoryType, memoryId); }

  // ---------- Event log ----------
  addEventLogEntry(petId, logEntry) { return this.adapter.addEventLogEntry(petId, logEntry); }
  getEventLog(petId, limit = 100) { return this.adapter.getEventLog(petId, limit); }
}
