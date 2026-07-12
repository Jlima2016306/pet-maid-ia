// domain/useCases/BuildMemoryIndex.js
// PURE logic. Flattens the per-type memory map from getAllMemories() into a
// compact, token-cheap index the AI can pick from ({id, type, text}). The AI
// only sees this index; the full memory content is fetched by id after it
// chooses one.

const MAX_TEXT_LENGTH = 80;

function memoryText(type, m) {
  let text = "";
  if (type === "person") text = `${m.name ?? "?"} (${m.relationship ?? "?"})`;
  else if (type === "preference") text = `${m.preferenceType ?? "?"}: ${m.value ?? ""}`;
  else text = m.description || m.title || m.emotion || "";
  return String(text).slice(0, MAX_TEXT_LENGTH);
}

export function buildMemoryIndex(memoriesByType = {}) {
  const index = [];
  const push = (type, list) => {
    for (const m of list ?? []) {
      if (m?.id) index.push({ id: m.id, type, text: memoryText(type, m) });
    }
  };
  push("coreEmotion", memoriesByType.coreEmotions);
  push("person", memoriesByType.people);
  push("experience", memoriesByType.experiences);
  push("preference", memoriesByType.preferences);
  push("ephemeral", memoriesByType.ephemeral);
  return index;
}
