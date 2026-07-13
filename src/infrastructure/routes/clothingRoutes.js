// infrastructure/routes/clothingRoutes.js
// Clothing catalog endpoints. HTTP <-> orchestrator translation only.

import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

export function createClothingRoutes({ clothingOrchestrator }) {
  const router = Router();

  // Seed/refresh the catalog from the domain presets (idempotent).
  router.post(
    "/init",
    asyncHandler(async (req, res) => {
      const items = await clothingOrchestrator.initCatalog();
      res.status(201).json(items);
    })
  );

  // List the full catalog.
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(await clothingOrchestrator.listCatalog());
    })
  );

  return router;
}
