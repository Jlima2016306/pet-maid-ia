// services/db/adapters/repositories/PetRepository.js
// Handles the ROOT pet document: identity + embedded neuroState (brain),
// physicalState (body) and bodyParts. Also owns the atomic tick transaction.
// Everything here is about the pet document itself, NOT its subcollections.

import { withId, splitId } from "./_firestoreHelpers.js";

export class PetRepository {
  constructor(petsCollection, db) {
    this.pets = petsCollection; // db.collection("pets")
    this.db = db;               // needed for transactions
  }

  async create(pet) {
    const { id, data } = splitId(pet);
    const ref = id ? this.pets.doc(id) : this.pets.doc();
    await ref.set(data);
    return withId(await ref.get());
  }

  async getById(petId) {
    return withId(await this.pets.doc(petId).get());
  }

  async exists(petId) {
    const snap = await this.pets.doc(petId).get();
    return snap.exists;
  }

  async save(pet) {
    const { id, data } = splitId(pet);
    if (!id) throw new Error("PetRepository.save() requires pet.id");
    const ref = this.pets.doc(id);
    await ref.set(data); // full replace
    return withId(await ref.get());
  }

  // Partial update with dot-notation keys, e.g. { "neuroState.cortisol": 0.82 }
  async updateFields(petId, fields) {
    const ref = this.pets.doc(petId);
    try {
      await ref.update(fields);
    } catch (err) {
      if (err.code === 5) { // Firestore NOT_FOUND -> proper 404 instead of a raw 500
        const e = new Error(`Pet ${petId} not found`);
        e.status = 404;
        throw e;
      }
      throw err;
    }
    return withId(await ref.get());
  }

  async delete(petId) {
    await this.pets.doc(petId).delete();
    return true;
  }

  // Atomic "tick": read current pet, let mutatorFn compute the field updates,
  // apply them in one transaction. All-or-nothing. Returns the pet re-read
  // AFTER commit: the updates use dot-notation keys, so merging them into the
  // in-memory object would corrupt its nested shape.
  async runTransaction(petId, mutatorFn) {
    const ref = this.pets.doc(petId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const e = new Error(`Pet ${petId} not found`);
        e.status = 404;
        throw e;
      }
      const currentPet = { id: snap.id, ...snap.data() };

      const fieldUpdates = await mutatorFn(currentPet);
      if (fieldUpdates && Object.keys(fieldUpdates).length > 0) {
        tx.update(ref, fieldUpdates);
      }
    });
    return withId(await ref.get());
  }
}
