// services/db/adapters/repositories/MemoryRepository.js

export class MemoryRepository {
  constructor(db) {
    this.db = db;
  }

  // CORE EMOTIONS
  async addCoreEmotion(petId, emotion) {
    const ref = this.db.collection("pets").doc(petId).collection("memories").doc("coreEmotions").collection("entries").doc();
    await ref.set(emotion);
    return { ...emotion, id: ref.id };
  }

  async getCoreEmotions(petId) {
    const snap = await this.db
      .collection("pets")
      .doc(petId)
      .collection("memories")
      .doc("coreEmotions")
      .collection("entries")
      .orderBy("timestamp", "desc")
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // PERSON MEMORIES
  async addPersonMemory(petId, personMemory) {
    const ref = this.db.collection("pets").doc(petId).collection("memories").doc("people").collection("entries").doc();
    await ref.set(personMemory);
    return { ...personMemory, id: ref.id };
  }

  async getPersonMemories(petId) {
    const snap = await this.db
      .collection("pets")
      .doc(petId)
      .collection("memories")
      .doc("people")
      .collection("entries")
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getPersonMemory(petId, personId) {
    const snap = await this.db
      .collection("pets")
      .doc(petId)
      .collection("memories")
      .doc("people")
      .collection("entries")
      .where("personId", "==", personId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // EXPERIENCES
  async addExperience(petId, experience) {
    const ref = this.db.collection("pets").doc(petId).collection("memories").doc("experiences").collection("entries").doc();
    await ref.set(experience);
    return { ...experience, id: ref.id };
  }

  async getExperiences(petId) {
    const snap = await this.db
      .collection("pets")
      .doc(petId)
      .collection("memories")
      .doc("experiences")
      .collection("entries")
      .orderBy("timestamp", "desc")
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // PREFERENCES
  async addPreference(petId, preference) {
    const ref = this.db.collection("pets").doc(petId).collection("memories").doc("preferences").collection("entries").doc();
    await ref.set(preference);
    return { ...preference, id: ref.id };
  }

  async getPreferences(petId) {
    const snap = await this.db
      .collection("pets")
      .doc(petId)
      .collection("memories")
      .doc("preferences")
      .collection("entries")
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // EPHEMERAL
  async addEphemeralMemory(petId, ephemeralMemory) {
    const ref = this.db.collection("pets").doc(petId).collection("memories").doc("ephemeral").collection("entries").doc();
    await ref.set(ephemeralMemory);
    return { ...ephemeralMemory, id: ref.id };
  }

  async getEphemeralMemories(petId) {
    const snap = await this.db
      .collection("pets")
      .doc(petId)
      .collection("memories")
      .doc("ephemeral")
      .collection("entries")
      .where("expiresAt", ">", new Date().toISOString())
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // EVENT LOG
  async addEventLogEntry(petId, logEntry) {
    const ref = this.db.collection("pets").doc(petId).collection("eventLog").doc();
    await ref.set(logEntry);
    return { ...logEntry, id: ref.id };
  }

  async getEventLog(petId, limit = 100) {
    const snap = await this.db
      .collection("pets")
      .doc(petId)
      .collection("eventLog")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // GENERAL
  async getAllMemories(petId, type = null) {
    const results = {};
    if (!type || type === "coreEmotions") results.coreEmotions = await this.getCoreEmotions(petId);
    if (!type || type === "people") results.people = await this.getPersonMemories(petId);
    if (!type || type === "experiences") results.experiences = await this.getExperiences(petId);
    if (!type || type === "preferences") results.preferences = await this.getPreferences(petId);
    if (!type || type === "ephemeral") results.ephemeral = await this.getEphemeralMemories(petId);
    return results;
  }

  async updateMemory(petId, memoryType, memoryId, updates) {
    const docPath = `pets/${petId}/memories/${memoryType}/entries/${memoryId}`;
    await this.db.doc(docPath).update(updates);
  }

  async deleteMemory(petId, memoryType, memoryId) {
    const docPath = `pets/${petId}/memories/${memoryType}/entries/${memoryId}`;
    await this.db.doc(docPath).delete();
  }
}