// services/db/adapters/repositories/StatisticRepository.js
// Handles the pets/{petId}/statistics subcollection ONLY.

import { withId, mapDocs, splitId } from "./_firestoreHelpers.js";

export class StatisticRepository {
  constructor(petsCollection) {
    this.pets = petsCollection;
  }

  _col(petId) {
    return this.pets.doc(petId).collection("statistics");
  }

  async add(petId, statistic) {
    const { id, data } = splitId(statistic);
    const ref = id ? this._col(petId).doc(id) : this._col(petId).doc();
    await ref.set(data);
    return withId(await ref.get());
  }

  // Most-recent-first, limited, for charts/history.
  async list(petId, limit = 50) {
    const snap = await this._col(petId)
      .orderBy("recordedAt", "desc")
      .limit(limit)
      .get();
    return mapDocs(snap);
  }
}
