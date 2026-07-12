// services/db/adapters/repositories/_firestoreHelpers.js
// Small shared helpers used by every repository slice. Keeps the id-merging and
// mapping logic in ONE place instead of copy-pasted across files.

// Merge the Firestore doc id back as `id`. Returns null if the doc is missing.
export function withId(docSnap) {
  if (!docSnap.exists) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

// Map a query snapshot to an array of domain-shaped objects.
export function mapDocs(querySnap) {
  return querySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Pull `id` out of a domain object, returning { id, data } for writes.
export function splitId(entity) {
  const { id, ...data } = entity;
  return { id, data };
}
