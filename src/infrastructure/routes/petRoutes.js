// infrastructure/routes/petRoutes.js
// Express endpoints. They ONLY translate HTTP <-> orchestrator calls. No
// business logic, no DB, no IA here. The orchestrator is injected via the
// container, so routes never import concrete adapters.

import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

// Receives the container from injector.buildContainer().
export function createPetRoutes({ petOrchestrator, interactionOrchestrator, clothingOrchestrator }) {
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
  // (req.body is undefined when no JSON body is sent — default it everywhere
  //  so a bare POST doesn't crash with a 500.)
  router.post(
    "/:petId/feed",
    asyncHandler(async (req, res) => {
      const body = req.body ?? {};
      const pet = await petOrchestrator.feed(req.params.petId, body.nutrition);
      res.json(pet);
    })
  );

  router.post(
    "/:petId/play",
    asyncHandler(async (req, res) => {
      const body = req.body ?? {};
      const pet = await petOrchestrator.play(req.params.petId, body.intensity);
      res.json(pet);
    })
  );

  router.post(
    "/:petId/sleep",
    asyncHandler(async (req, res) => {
      const body = req.body ?? {};
      const pet = await petOrchestrator.sleep(req.params.petId, body.hours);
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
      const body = req.body ?? {};
      const thought = await petOrchestrator.think(req.params.petId, body.context);
      res.json(thought);
    })
  );

  // AI: full interaction pipeline (gather -> assess -> validate -> apply -> reply).
  // body: { message, context? }. Response splits the reply in two channels:
  // message (dialogue) + action (narration). The reply's hidden saveMemory
  // directive is consumed server-side and never appears in this response.
  router.post(
    "/:petId/interact",
    asyncHandler(async (req, res) => {
      const body = req.body ?? {};
      const result = await interactionOrchestrator.interact(
        req.params.petId,
        body.message,
        body.context
      );
      res.json(result);
    })
  );

  // AI: the user asks her to remove garments; the AI decides in character
  // (grounded by the numeric disposition). body: { message, itemIds?, context? }
  router.post(
    "/:petId/clothing/request-removal",
    asyncHandler(async (req, res) => {
      const body = req.body ?? {};
      const result = await interactionOrchestrator.requestUndress(
        req.params.petId,
        body.message,
        Array.isArray(body.itemIds) ? body.itemIds.map(String) : null,
        body.context
      );
      res.json(result);
    })
  );

  // Wardrobe: direct equip/unequip (no AI involved).
  // body: { itemIds: ["..."] } or { itemId: "..." }
  router.post(
    "/:petId/clothing/equip",
    asyncHandler(async (req, res) => {
      const pet = await clothingOrchestrator.equip(req.params.petId, req.body ?? {});
      res.json(pet);
    })
  );

  router.post(
    "/:petId/clothing/unequip",
    asyncHandler(async (req, res) => {
      const pet = await clothingOrchestrator.unequip(req.params.petId, req.body ?? {});
      res.json(pet);
    })
  );

  // AI: reply to the user's message.
  // body: { message, context? }
  router.post(
    "/:petId/talk",
    asyncHandler(async (req, res) => {
      const body = req.body ?? {};
      const thought = await petOrchestrator.talk(
        req.params.petId,
        body.message,
        body.context
      );
      res.json(thought);
    })
  );

  return router;
}
