// services/db/adapters/repositories/ClothingRepository.js
// Handles the top-level clothingCatalog collection ONLY.

import { withId, mapDocs } from "./_firestoreHelpers.js";

export class ClothingRepository {
  constructor(clothingCollection) {
    this.clothing = clothingCollection; // db.collection("clothingCatalog")
  }

  async getById(itemId) {
    return withId(await this.clothing.doc(itemId).get());
  }

  async list() {
    return mapDocs(await this.clothing.get());
  }

  // Idempotent upsert with the item id as doc id (used by the catalog seeder).
  async set(itemId, item) {
    const { id: _ignored, ...data } = item;
    await this.clothing.doc(itemId).set(data);
    return { ...data, id: itemId };
  }
}
