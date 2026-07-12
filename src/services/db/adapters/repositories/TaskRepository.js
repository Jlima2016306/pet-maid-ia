// services/db/adapters/repositories/TaskRepository.js
// Handles the pets/{petId}/tasks subcollection ONLY.

import { withId, mapDocs, splitId } from "./_firestoreHelpers.js";

export class TaskRepository {
  constructor(petsCollection) {
    this.pets = petsCollection;
  }

  _col(petId) {
    return this.pets.doc(petId).collection("tasks");
  }

  async add(petId, task) {
    const { id, data } = splitId(task);
    const ref = id ? this._col(petId).doc(id) : this._col(petId).doc();
    await ref.set(data);
    return withId(await ref.get());
  }

  async list(petId) {
    return mapDocs(await this._col(petId).get());
  }

  async update(petId, task) {
    const { id, data } = splitId(task);
    if (!id) throw new Error("TaskRepository.update() requires task.id");
    const ref = this._col(petId).doc(id);
    await ref.update(data);
    return withId(await ref.get());
  }

  async remove(petId, taskId) {
    await this._col(petId).doc(taskId).delete();
    return true;
  }
}
