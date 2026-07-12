// services/db/adapters/repositories/BodyRepository.js
// Handles the body subcollections ONLY:
//   pets/{petId}/specialOrgans/{organId}
//   pets/{petId}/erogenousZones/{zoneId}
// Doc ids are the organ/zone ids themselves (e.g. "vagina", "breasts"), so
// seeding is naturally idempotent: re-seeding overwrites instead of duplicating.

import { mapDocs } from "./_firestoreHelpers.js";

export class BodyRepository {
  constructor(petsCollection) {
    this.pets = petsCollection;
  }

  _organs(petId) {
    return this.pets.doc(petId).collection("specialOrgans");
  }

  _zones(petId) {
    return this.pets.doc(petId).collection("erogenousZones");
  }

  async setSpecialOrgan(petId, organId, organ) {
    await this._organs(petId).doc(organId).set(organ);
    return { ...organ, id: organId };
  }

  async listSpecialOrgans(petId) {
    return mapDocs(await this._organs(petId).get());
  }

  async setErogenousZone(petId, zoneId, zone) {
    await this._zones(petId).doc(zoneId).set(zone);
    return { ...zone, id: zoneId };
  }

  async listErogenousZones(petId) {
    return mapDocs(await this._zones(petId).get());
  }
}
