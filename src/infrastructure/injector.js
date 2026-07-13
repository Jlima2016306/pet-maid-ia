// infrastructure/injector.js
// THE single point of decision. This is the ONLY file that knows which concrete
// adapters are active. Everything else depends on services/ports.
//
// Swap the database  -> change ONE line (new RepositoryAdapter).
// Swap the AI vendor -> change ONE line (new IaAdapter).
//
// Built once and reused (singleton) so we don't re-init Firestore/Gemini.

import { FirestoreAdapter } from "../services/db/adapters/FirestoreAdapter.js";
import { GeminiAdapter } from "../services/ia/adapters/GeminiAdapter.js";

import { RepositoryService } from "../services/db/RepositoryService.js";
import { IaService } from "../services/ia/IaService.js";

import { PetOrchestrator } from "../application/orchestrators/PetOrchestrator.js";
import { InteractionOrchestrator } from "../application/orchestrators/InteractionOrchestrator.js";
import { ClothingOrchestrator } from "../application/orchestrators/ClothingOrchestrator.js";

let container = null;

export function buildContainer() {
  if (container) return container; // reuse across the app

  // --- Choose concrete adapters HERE (the only place) ---
  const repositoryAdapter = new FirestoreAdapter();   // -> new MongoAdapter() to switch DB
  const iaAdapter = new GeminiAdapter();              // -> new ClaudeAdapter() to switch AI

  // --- Wrap them in services the app will consume ---
  const repositoryService = new RepositoryService(repositoryAdapter);
  const iaService = new IaService(iaAdapter);

  // --- Build orchestrators with their injected services ---
  const petOrchestrator = new PetOrchestrator({ repositoryService, iaService });
  const interactionOrchestrator = new InteractionOrchestrator({ repositoryService, iaService });
  const clothingOrchestrator = new ClothingOrchestrator({ repositoryService });

  container = {
    repositoryService,
    iaService,
    petOrchestrator,
    interactionOrchestrator,
    clothingOrchestrator,
  };

  return container;
}
