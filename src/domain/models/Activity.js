// domain/models/Activity.js
// Habits, Tasks and Statistics. These are UNBOUNDED and grow over time, so
// they live in SUBCOLLECTIONS under the pet, NOT embedded in the pet document
// (Firestore documents have a 1 MiB limit and embedding growing lists hurts
// read cost). Query them only when needed.
//
//   pets/{petId}/habits/{habitId}
//   pets/{petId}/tasks/{taskId}
//   pets/{petId}/statistics/{statId}

// ---- Habit: a recurring behavior that stabilizes serotonin when kept ----
export function createHabit({
  id = null,
  name = "",
  frequency = "daily",       // "daily" | "weekly" | custom
  streak = 0,                // consecutive completions
  lastCompletedAt = null,    // ISO string or null
  serotoninReward = 0.05,    // how much a kept habit nudges serotonin up
  createdAt = new Date().toISOString(),
} = {}) {
  return { id, name, frequency, streak, lastCompletedAt, serotoninReward, createdAt };
}

// ---- Task: a discrete objective; completing it rewards dopamine ----
export function createTask({
  id = null,
  title = "",
  isPhysical = false,        // physical tasks train muscleStrength + release endorphins
  isCompleted = false,
  dopamineReward = 0.1,      // completion nudges dopamine up
  dueAt = null,              // ISO string or null
  completedAt = null,
  createdAt = new Date().toISOString(),
} = {}) {
  return { id, title, isPhysical, isCompleted, dopamineReward, dueAt, completedAt, createdAt };
}

// ---- Statistic: a timestamped snapshot for charts / history ----
export function createStatistic({
  id = null,
  recordedAt = new Date().toISOString(),
  // snapshot of key metrics at this point in time
  neuroSnapshot = {},        // copy of neuroState
  physicalSnapshot = {},     // copy of physicalState
  bmi = 0,                   // computed at record time
} = {}) {
  return { id, recordedAt, neuroSnapshot, physicalSnapshot, bmi };
}
