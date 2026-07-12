# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start with nodemon (auto-restart), reads .env via dotenv/config
npm start        # start once with node
```

There is no test suite (`npm test` is the default placeholder) and no lint config. There is no build step — it's plain ESM Node (`"type": "module"` in package.json), run directly with `node src/main.js`.

Requires `credentials/firebase-key.json` (a Firebase service-account key) and a `.env` with at least `GEMINI_API_KEY`. See `.env` for the full variable list; `GOOGLE_APPLICATION_CREDENTIALS` overrides the default key path.

## Architecture

Hexagonal / ports-and-adapters. Dependency direction is always **outside-in**: routes -> orchestrator -> services -> ports <- adapters. Domain code (`src/domain/`) never imports anything from `services/` or `infrastructure/`.

```
routes (Express) -> PetOrchestrator -> {RepositoryService, IaService} -> Port -> concrete Adapter
                          |
                          v
                  pure domain useCases (no I/O)
```

**The single swap point is `src/infrastructure/injector.js`.** It is the only file allowed to know which concrete adapter is active. To change database or AI vendor, add a new adapter implementing the relevant port and change one `new XAdapter()` line there — nothing else in the app should need to change. `buildContainer()` is a memoized singleton (built once, reused for the app's lifetime).

### Layers

- **`domain/models/`** — plain factory functions (`createPet`, `createNeuroState`, ...) that return plain object literals. No classes, no methods, no I/O. These define the shape of everything persisted.
- **`domain/ports/`** — abstract contracts (`IaPort`, `RepositoryPort`) as ES classes whose methods all throw "not implemented". Any adapter must extend and override every method used.
- **`domain/useCases/`** — pure functions `(pet, ...args) -> fieldUpdateMap`. They read a domain model and return a flat, dot-notation partial-update object (e.g. `{"neuroState.cortisol": 0.4, "physicalState.bloodGlucose": 0.8}`). They never touch the DB or the AI; the orchestrator applies the returned map inside a transaction. Some use case files exist but are currently empty stubs (`MakePetThink.js`) — implement following the pattern of `FeedPet.js`/`PlayWithPet.js`/`SleepPet.js`.
- **`domain/presets/`** — static data factories for seeding new pets: `neuroPresets` (starting neurotransmitter levels per personality archetype), `physicalPresets` (body/appearance/organs/erogenous zones per body type), `memoryPresets` (starting preferences/experiences per personality). Personality IDs are shared strings (e.g. `"maidTsundere"`, `"maidYandere"`, `"maidDeredere"`, `"maidHevel"`, `"emotionless"`) used to key both neuro and memory presets together.
- **`application/orchestrators/PetOrchestrator.js`** — the only place that coordinates services + use cases. Constructor takes `{ repositoryService, iaService }` (constructor injection, no service locator). `application/hooks/` (`useIa.js`, `useRepository.js`) exist but are currently empty — not yet wired in.
- **`services/db/RepositoryService.js`** / **`services/ia/IaService.js`** — thin pass-through wrappers around whatever adapter is injected. The rest of the app depends on these, never on a concrete adapter class.
- **`services/db/adapters/FirestoreAdapter.js`** — implements `RepositoryPort` by delegating to per-domain repository classes under `repositories/` (`PetRepository`, `HabitRepository`, `TaskRepository`, `StatisticRepository`, `ClothingRepository`, `MemoryRepository`). Each repository owns exactly one Firestore collection/subcollection; `_firestoreHelpers.js` holds the shared `withId`/`mapDocs`/`splitId` helpers. When adding a new persisted concept, add a new repository file rather than growing an existing one.
- **`services/ia/adapters/GeminiAdapter.js`** — implements `IaPort` by delegating to three pieces under `gemini/`: `geminiClient.js` (SDK/model singleton, model name from `GEMINI_MODEL` env), `promptBuilder.js` (turns Pet state into prompt text — this is where personality/interpretation rules for the neuro values live), `thoughtParser.js` (parses the model's JSON reply into a `Thought`, degrading gracefully to a neutral `Thought` on parse failure rather than throwing).
- **`infrastructure/`** — Express wiring only: `routes/petRoutes.js` translates HTTP <-> orchestrator calls with zero business logic, `middleware/errorHandler.js` provides `asyncHandler` (wraps async route handlers so thrown errors reach Express's error middleware) plus `notFound`/`errorHandler`, `config/firebase.config.js` lazily initializes the Firestore Admin SDK singleton from the service-account key file.

### Data model notes

- A pet document (`pets/{petId}`) embeds `neuroState` (7 normalized 0-1 neurotransmitter/hormone values per Lövheim's Cube of Emotion + cortisol/melatonin/adrenaline), `physicalState` (metabolism/body attributes), `bodyParts` (8 named parts with integrity/temperature/sensitivity), and `arousalState`. `computeWeightKg`/`computeBmi` in `PhysicalState.js` are derived on read, never stored.
- `specialOrgans` and `erogenousZones` live in **subcollections**, not embedded, and are seeded by `InitializePet.js` alongside the embedded blocks. Every catalog zone in `erogenousZoneCatalog.js` always exists per-pet at 0 progress; a zone only becomes "erogenous" once `progressToErogenous` reaches 100 — that progress is permanent and never resets.
- `initializePet()` is idempotent via `_neuroSeeded`/`_bodySeeded` flags on the pet — re-running it on an existing pet fills in only what's missing rather than overwriting.
- Multi-field state changes (feed/play/sleep) must go through `RepositoryPort.runPetTransaction(petId, mutatorFn)` so a tick is applied atomically — never call `updatePetFields` directly for a use case that touches more than one field for this reason.
- `domain/models/memory/` defines several memory shapes (`CoreEmotion` — permanent, doesn't decay; `Experience`/`Trauma` — decays slowly; `EphemeralMemory` — decays fast, has `expiresAt`; `PersonMemory` — permanent relationship tracking; `Preference`) all built from a common `createMemoryBase` shape (`id`, `timestamp`, `intensity`, `decay`, `linkedMemoryIds`, `tags`). `MemoryRepository` stores each type in its own `pets/{petId}/memories/{type}/entries` subcollection.
- Clothing (`clothingCatalog/{itemId}`) is intentionally denormalized: a garment declares which body parts it `covers`; the pet stores only `equippedItemIds`. There is no junction table/collection.

### Interaction pipeline (`POST /pets/:petId/interact`)

The main conversational flow lives in `application/orchestrators/InteractionOrchestrator.js` and runs five steps, two of which are Gemini calls:

1. **Gather** — load pet + equipped clothing + memories + erogenous zones; compute `computeBodyCoverage()` (which parts are clothed vs naked) and `computeAfflictions()` (numeric ground truth: hunger, stress, pain... each with severity 0-1 and the stat evidence behind it).
2. **Assess (AI call #1)** — `buildAssessPrompt` (Spanish) shows the AI the full state, a **closed affliction vocabulary** (`AFFLICTION_VOCABULARY`), and a compact memory index; the AI returns proposed afflictions, stat **deltas**, and an optional `usedMemoryId`.
3. **Validate** — `validateAiAssessment()` (pure domain) rejects any claimed affliction the numbers don't support, force-includes critical ones (severity ≥ `CRITICAL_SEVERITY`), and whitelists+clamps deltas per `DELTA_LIMITS`. **Nothing the AI says is trusted directly.**
4. **Apply** — `applyApprovedDeltas()` runs *inside* `runPetTransaction` against the freshly-read pet (so concurrent interactions can't stack past clamps), then the pet is **re-read** (the transaction's return value mixes dot-notation keys into the object — never feed it to a prompt).
5. **Reply (AI call #2)** — `buildRespondInteractionPrompt` (Spanish, in-character) from the updated state. The user's message always indicates where they're looking; the AI describes that body part from DB data (clothing or nakedness, temperature, physicalDetails). The reply carries a **hidden `saveMemory` directive** consumed server-side (persisted via the matching memory factory, stripped from the HTTP response).

Contract chain to keep in sync when editing: prompt builders (`interactionPromptBuilder.js`) ↔ parsers (`interactionParser.js`) ↔ domain shapes (`Interaction.js`) ↔ validator (`ValidateAiAssessment.js`) ↔ orchestrator. The smoke test for the pure-domain parts of this chain lives outside the repo (no test framework installed).

### Known inconsistencies to be aware of

- `.env` declares `FIRESTORE_PETS_COLLECTION`/`FIRESTORE_CLOTHING_COLLECTION` but nothing in `src/` reads them — collection names are hardcoded (`"pets"`, `"clothingCatalog"`) in `FirestoreAdapter.js`.
- `domain/useCases/MakePetThink.js`, `application/hooks/useIa.js`, and `application/hooks/useRepository.js` are empty files (placeholders for not-yet-implemented functionality).
- `FirestoreAdapter.deletePet` cleans habits/tasks/statistics but not the newer subcollections (memories, eventLog, specialOrgans, erogenousZones).
