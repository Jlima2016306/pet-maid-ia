// domain/useCases/ComputeBodyCoverage.js
// PURE logic. Given the pet's bodyParts and the list of equipped ClothingItems,
// computes which parts are covered by clothing and which are exposed (naked).
// The AI prompt uses this so it can describe covered parts by their garments
// and uncovered parts as bare skin. No DB access here.

export function computeBodyCoverage(bodyParts = {}, equippedItems = []) {
  const coverage = {};
  for (const partId of Object.keys(bodyParts)) {
    coverage[partId] = { covered: false, items: [] };
  }

  for (const item of equippedItems) {
    for (const partId of item?.covers ?? []) {
      if (coverage[partId]) {
        coverage[partId].covered = true;
        coverage[partId].items.push(item.name || item.id);
      }
    }
  }

  const nakedParts = Object.keys(coverage).filter((id) => !coverage[id].covered);

  return {
    coverage,                 // { partId: { covered, items: [garment names] } }
    nakedParts,               // [partId] with no garment on them
    isFullyNaked: nakedParts.length === Object.keys(coverage).length,
  };
}
