// domain/useCases/ComputeZoneExposure.js
// PURE logic. Determines which intimate/erogenous zones are hidden by the
// equipped garments (their coversZones) and which are EXPOSED, and selects the
// zones worth sending to the AI prompt. This is what lets the reply describe
// "what the user is actually seeing" — a naked zone gets described from its
// data, a covered one gets described through its garment. No DB access here.

import { EROGENOUS_ZONE_CATALOG } from "../models/erogenousZoneCatalog.js";

// Zones that are always worth describing when gazed at, developed or not.
const ALWAYS_NOTABLE = new Set(["breasts", "nipples", "glutes", "innerThighs", "feet", "hands", "lips", "neck"]);

// Map of zoneId -> [garment names] hiding it, from the equipped items.
export function computeCoveredZones(equippedItems = []) {
  const covered = {};
  for (const item of equippedItems) {
    for (const zoneId of item?.coversZones ?? []) {
      (covered[zoneId] ??= []).push(item.name || item.id);
    }
  }
  return covered;
}

// Builds the prompt-ready exposure list from the pet's zone docs:
//   [{ zoneId, tier, covered, garments, erogena, sensibilidad, detalles, arousal }]
// Included zones: primary tier, the always-notable set, and anything developed
// or carrying visible phenomena. The rest is omitted to save tokens.
export function computeZoneExposure(zones = [], equippedItems = []) {
  const coveredZones = computeCoveredZones(equippedItems);

  return zones
    .filter((z) => {
      const zoneId = z.zoneId ?? z.id;
      const meta = EROGENOUS_ZONE_CATALOG[zoneId];
      const isPrimary = (z.tier ?? meta?.tier) === "primary";
      const isActive =
        z.isErogenous === true ||
        (z.developedSensitivity ?? 0) > 0 ||
        (z.physicalDetails?.length ?? 0) > 0;
      return isPrimary || ALWAYS_NOTABLE.has(zoneId) || isActive;
    })
    .map((z) => {
      const zoneId = z.zoneId ?? z.id;
      const garments = coveredZones[zoneId] ?? [];
      return {
        zoneId,
        tier: z.tier,
        covered: garments.length > 0,
        garments,
        erogena: z.isErogenous === true,
        sensibilidad: z.developedSensitivity ?? 0,
        detalles: z.physicalDetails ?? [],
        arousal: z.currentArousal ?? 0,
      };
    });
}
