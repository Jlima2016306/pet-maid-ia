// application/orchestrators/ClothingOrchestrator.js
// Wardrobe management: seed the clothing catalog and equip/unequip garments
// on a pet. Direct commands only — the "please take that off" flow where the
// AI decides lives in InteractionOrchestrator.requestUndress(). Knows nothing
// about Firestore; only the injected repository service + domain presets.

import { buildClothingCatalog } from "../../domain/presets/clothingPresets.js";

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// Accepts { itemIds: [...] } or { itemId: "x" } bodies.
function normalizeItemIds(body = {}) {
  if (Array.isArray(body.itemIds)) return body.itemIds.map(String);
  if (typeof body.itemId === "string" && body.itemId) return [body.itemId];
  return [];
}

export class ClothingOrchestrator {
  constructor({ repositoryService }) {
    this.repo = repositoryService;
  }

  // Seed/refresh the clothingCatalog collection from the domain presets.
  // Idempotent: doc id = preset key, so re-running overwrites.
  async initCatalog() {
    const catalog = buildClothingCatalog();
    const saved = await Promise.all(
      Object.entries(catalog).map(([itemId, item]) => this.repo.setClothingItem(itemId, item))
    );
    return saved;
  }

  async listCatalog() {
    return this.repo.listClothingItems();
  }

  // Put garments on: validates each item exists in the catalog, then unions
  // them into equippedItemIds.
  async equip(petId, body) {
    const itemIds = normalizeItemIds(body);
    if (itemIds.length === 0) throw badRequest("itemIds is required");

    const pet = await this.repo.getPet(petId);
    if (!pet) throw notFound(`Pet ${petId} not found`);

    const items = await Promise.all(itemIds.map((id) => this.repo.getClothingItem(id)));
    const missing = itemIds.filter((_, i) => !items[i]);
    if (missing.length > 0) {
      throw badRequest(`Unknown clothing items: ${missing.join(", ")} (seed the catalog with POST /clothing/init)`);
    }

    const equipped = new Set(pet.equippedItemIds ?? []);
    itemIds.forEach((id) => equipped.add(id));

    return this.repo.updatePetFields(petId, {
      equippedItemIds: [...equipped],
      updatedAt: new Date().toISOString(),
    });
  }

  // Take garments off directly (the user undresses her; no AI decision).
  async unequip(petId, body) {
    const itemIds = normalizeItemIds(body);
    if (itemIds.length === 0) throw badRequest("itemIds is required");

    const pet = await this.repo.getPet(petId);
    if (!pet) throw notFound(`Pet ${petId} not found`);

    const remove = new Set(itemIds);
    const remaining = (pet.equippedItemIds ?? []).filter((id) => !remove.has(id));

    return this.repo.updatePetFields(petId, {
      equippedItemIds: remaining,
      updatedAt: new Date().toISOString(),
    });
  }
}
