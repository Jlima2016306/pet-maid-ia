// infrastructure/routes/petRoutes.js
// Express endpoints. They ONLY translate HTTP <-> orchestrator calls. No
// business logic, no DB, no IA here. The orchestrator is injected via the
// container, so routes never import concrete adapters.

import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

// Receives the container from injector.buildContainer().
export function createPetRoutes({ petOrchestrator, interactionOrchestrator }) {
  const router = Router();

  // Create or initialize a pet with presets.
  // body: { petId?, name, neuroPresetId, bodyPresetId }
  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const pet = await petOrchestrator.createOrInitPet(req.body);
      res.status(201).json(pet);
    })
  );

  // Get a pet by id.
  router.get(
    "/:petId",
    asyncHandler(async (req, res) => {
      const pet = await petOrchestrator.getPet(req.params.petId);
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      res.json(pet);
    })
  );

  // Actions. body carries the intensity/nutrition/hours (all optional).
  router.post(
    "/:petId/feed",
    asyncHandler(async (req, res) => {
      const pet = await petOrchestrator.feed(req.params.petId, req.body.nutrition);
      res.json(pet);
    })
  );

  router.post(
    "/:petId/play",
    asyncHandler(async (req, res) => {
      const pet = await petOrchestrator.play(req.params.petId, req.body.intensity);
      res.json(pet);
    })
  );

  router.post(
    "/:petId/sleep",
    asyncHandler(async (req, res) => {
      const pet = await petOrchestrator.sleep(req.params.petId, req.body.hours);
      res.json(pet);
    })
  );

  router.post(
    "/:petId/wake",
    asyncHandler(async (req, res) => {
      const pet = await petOrchestrator.wake(req.params.petId);
      res.json(pet);
    })
  );

  // AI: autonomous thought.
  router.post(
    "/:petId/think",
    asyncHandler(async (req, res) => {
      const thought = await petOrchestrator.think(req.params.petId, req.body.context);
      res.json(thought);
    })
  );

  // AI: full interaction pipeline (gather -> assess -> validate -> apply -> reply).
  // body: { message, context? }. The reply's hidden saveMemory directive is
  // consumed server-side and never appears in this response.
  router.post(
    "/:petId/interact",
    asyncHandler(async (req, res) => {
      const result = await interactionOrchestrator.interact(
        req.params.petId,
        req.body.message,
        req.body.context
      );
      res.json(result);
    })
  );

  // AI: reply to the user's message.
  // body: { message, context? }
  router.post(
    "/:petId/talk",
    asyncHandler(async (req, res) => {
      const thought = await petOrchestrator.talk(
        req.params.petId,
        req.body.message,
        req.body.context
      );
      res.json(thought);
    })
  );

  return router;
}
