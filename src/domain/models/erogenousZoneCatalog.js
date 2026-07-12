// domain/models/erogenousZoneCatalog.js
// Master reference list (a SEED, just an example set). Lives as a top-level
// collection erogenousZoneCatalog/{zoneId} OR as a constant. Each entry only
// DESCRIBES a zone's nature. The per-pet state lives in ErogenousZone.js.
//
// A zone being in the catalog means it EXISTS and can be touched. It does not
// mean it is erogenous yet -- that is per-pet progress.

export const EROGENOUS_ZONE_CATALOG = {
  // ---------- Primary: genitals & pelvic floor ----------
  clitoris:     { name: "Clitoris",       tier: "primary", category: "genital", isSpecialOrgan: false, parentOrgan: "vagina" },
  labiaMajora:  { name: "Labia Majora",   tier: "primary", category: "genital", parentOrgan: "vagina" },
  labiaMinora:  { name: "Labia Minora",   tier: "primary", category: "genital", parentOrgan: "vagina" },
  vulva:        { name: "Vulva",          tier: "primary", category: "genital", parentOrgan: "vagina" },
  vaginalCanal: { name: "Vaginal Canal",  tier: "primary", category: "genital", parentOrgan: "vagina" },
  cervix:       { name: "Cervix",         tier: "primary", category: "genital", parentOrgan: "vagina" },
  perineum:     { name: "Perineum",       tier: "primary", category: "pelvic" },
  analZone:     { name: "Anal Zone",      tier: "primary", category: "pelvic", isSpecialOrgan: true },

  // ---------- Secondary: commonly high-sensitivity ----------
  breasts:      { name: "Breasts",        tier: "secondary", category: "common" },
  nipples:      { name: "Nipples",        tier: "secondary", category: "common", parentZone: "breasts" },
  neck:         { name: "Neck",           tier: "secondary", category: "common" },
  nape:         { name: "Nape",           tier: "secondary", category: "common" },
  lips:         { name: "Lips",           tier: "secondary", category: "common" },
  tongue:       { name: "Tongue",         tier: "secondary", category: "common" },
  earlobes:     { name: "Earlobes",       tier: "secondary", category: "common" },
  innerThighs:  { name: "Inner Thighs",   tier: "secondary", category: "common" },
  glutes:       { name: "Glutes",         tier: "secondary", category: "common" },

  // ---------- Tertiary: conditioned / fetish-frequent ----------
  feet:         { name: "Feet",           tier: "tertiary", category: "fetish" },
  hands:        { name: "Hands",          tier: "tertiary", category: "fetish" },
  armpits:      { name: "Armpits",        tier: "tertiary", category: "fetish" },
  lowerBack:    { name: "Lower Back",     tier: "tertiary", category: "fetish" },
  navel:        { name: "Navel/Abdomen",  tier: "tertiary", category: "fetish" },
  backOfKnees:  { name: "Back of Knees",  tier: "tertiary", category: "fetish" },
};

// Convenience id list.
export const EROGENOUS_ZONE_IDS = Object.keys(EROGENOUS_ZONE_CATALOG);
