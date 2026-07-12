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
}
