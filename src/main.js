// main.js
// Entry point. Boots Express, builds the DI container (which wires adapters ->
// services -> orchestrators), mounts routes, and starts listening.

import express from "express";
import "dotenv/config";

import { buildContainer } from "./infrastructure/injector.js";
import { createPetRoutes } from "./infrastructure/routes/petRoutes.js";
import { notFound, errorHandler } from "./infrastructure/middleware/errorHandler.js";

function createApp() {
  const app = express();
  app.use(express.json());

  // Build everything once.
  const container = buildContainer();

  // Health check.
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // Mount pet routes, passing the orchestrator from the container.
  app.use("/pets", createPetRoutes(container));

  // 404 + error handling last.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}


const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🐾 Tamagotchi backend running on port ${PORT}`);
});
