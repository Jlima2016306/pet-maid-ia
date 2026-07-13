// domain/ports/RepositoryPort.js
// CONTRACT for any database. Firestore, Mongo, in-memory... all must extend
// this class and implement every method. Methods always receive and return
// DOMAIN MODELS (Pet, Habit, Task, Statistic) -- never raw DB documents.
//
// The domain and application layers depend ONLY on this abstract class, so the
// concrete database can be swapped by changing one line in the injector.

export class RepositoryPort {
  // ---------- Pet (root document: pets/{petId}) ----------

  // Create a new pet document. Returns the saved Pet (with its generated id).
  async createPet(pet) {
    throw new Error("RepositoryPort.createPet() not implemented");
  }

  // Fetch a pet by id. Returns a Pet or null if it doesn't exist.
  async getPetById(petId) {
    throw new Error("RepositoryPort.getPetById() not implemented");
  }

  // Whether a pet document exists (cheap check for the initializer).
  async petExists(petId) {
    throw new Error("RepositoryPort.petExists() not implemented");
  }

  // Full replace of a pet document. Returns the saved Pet.
  async savePet(pet) {
    throw new Error("RepositoryPort.savePet() not implemented");
  }

  // Partial update using a flat field map with dot-notation keys, e.g.
  //   { "neuroState.cortisol": 0.82, "bodyParts.leftArm.integrityHp": 40 }
  // Returns the updated Pet.
  async updatePetFields(petId, fields) {
    throw new Error("RepositoryPort.updatePetFields() not implemented");
  }

  // Delete a pet and (implementation's responsibility) its subcollections.
  async deletePet(petId) {
    throw new Error("RepositoryPort.deletePet() not implemented");
  }

  // ---------- Subcollections: habits / tasks / statistics ----------
  // pets/{petId}/habits/{id}, /tasks/{id}, /statistics/{id}

  async addHabit(petId, habit) {
    throw new Error("RepositoryPort.addHabit() not implemented");
  }
  async listHabits(petId) {
    throw new Error("RepositoryPort.listHabits() not implemented");
  }
  async updateHabit(petId, habit) {
    throw new Error("RepositoryPort.updateHabit() not implemented");
  }

  async addTask(petId, task) {
    throw new Error("RepositoryPort.addTask() not implemented");
  }
  async listTasks(petId) {
    throw new Error("RepositoryPort.listTasks() not implemented");
  }
  async updateTask(petId, task) {
    throw new Error("RepositoryPort.updateTask() not implemented");
  }

  async addStatistic(petId, statistic) {
    throw new Error("RepositoryPort.addStatistic() not implemented");
  }
  // Most-recent-first, limited, for charts/history.
  async listStatistics(petId, limit = 50) {
    throw new Error("RepositoryPort.listStatistics() not implemented");
  }

  // ---------- Clothing catalog (top-level: clothingCatalog/{itemId}) ----------

  async getClothingItem(itemId) {
    throw new Error("RepositoryPort.getClothingItem() not implemented");
  }
  async listClothingItems() {
    throw new Error("RepositoryPort.listClothingItems() not implemented");
  }
  // Idempotent upsert keyed by itemId (catalog seeding).
  async setClothingItem(itemId, item) {
    throw new Error("RepositoryPort.setClothingItem() not implemented");
  }

  // ---------- Body subcollections ----------
  // pets/{petId}/specialOrgans/{organId} and pets/{petId}/erogenousZones/{zoneId}.
  // Doc ids ARE the organ/zone ids, so set() is an idempotent upsert.

  async setSpecialOrgan(petId, organId, organ) {
    throw new Error("RepositoryPort.setSpecialOrgan() not implemented");
  }
  async listSpecialOrgans(petId) {
    throw new Error("RepositoryPort.listSpecialOrgans() not implemented");
  }
  async setErogenousZone(petId, zoneId, zone) {
    throw new Error("RepositoryPort.setErogenousZone() not implemented");
  }
  async listErogenousZones(petId) {
    throw new Error("RepositoryPort.listErogenousZones() not implemented");
  }

  // ---------- Atomic multi-field mutation ----------
  // Runs several field updates on a pet in ONE atomic transaction, so a single
  // "tick"/action (e.g. eating: raise glucose AND lower cortisol AND update
  // bodyParts) can never be left half-applied.
  async runPetTransaction(petId, mutatorFn) {
    throw new Error("RepositoryPort.runPetTransaction() not implemented");
  }


  // MEMORIES
  async addCoreEmotion(petId, emotion) {
    throw new Error("Not implemented");
  }

  async addPersonMemory(petId, personMemory) {
    throw new Error("Not implemented");
  }

  async addExperience(petId, experience) {
    throw new Error("Not implemented");
  }

  async addPreference(petId, preference) {
    throw new Error("Not implemented");
  }

  async addEphemeralMemory(petId, ephemeralMemory) {
    throw new Error("Not implemented");
  }

  async getCoreEmotions(petId) {
    throw new Error("Not implemented");
  }

  async getPersonMemories(petId) {
    throw new Error("Not implemented");
  }

  async getAllMemories(petId, type = null) {
    throw new Error("Not implemented");
  }

  async updateMemory(petId, memoryType, memoryId, updates) {
    throw new Error("Not implemented");
  }

  async deleteMemory(petId, memoryType, memoryId) {
    throw new Error("Not implemented");
  }

  async addEventLogEntry(petId, logEntry) {
    throw new Error("Not implemented");
  }

  async getEventLog(petId, limit = 100) {
    throw new Error("Not implemented");
  }

}