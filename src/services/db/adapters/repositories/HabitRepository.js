// services/db/adapters/repositories/HabitRepository.js
// Handles the pets/{petId}/habits subcollection ONLY.

import { withId, mapDocs, splitId } from "./_firestoreHelpers.js";

export class HabitRepository {
  constructor(petsCollection) {
    this.pets = petsCollection;
  }

  _col(petId) {
    return this.pets.doc(petId).collection("habits");
  }

  async add(petId, habit) {
    const { id, data } = splitId(habit);
    const ref = id ? this._col(petId).doc(id) : this._col(petId).doc();
    await ref.set(data);
    return withId(await ref.get());
  }

  async list(petId) {
    return mapDocs(await this._col(petId).get());
  }

  async update(petId, habit) {
    const { id, data } = splitId(habit);
    if (!id) throw new Error("HabitRepository.update() requires habit.id");
    const ref = this._col(petId).doc(id);
    await ref.update(data);
    return withId(await ref.get());
  }

  async remove(petId, habitId) {
    await this._col(petId).doc(habitId).delete();
    return true;
  }
}
