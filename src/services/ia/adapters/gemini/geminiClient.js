// services/ia/adapters/gemini/geminiClient.js
// Initializes the Gemini SDK ONCE and exposes a model getter. The API key comes
// from GEMINI_API_KEY in .env -- it is NEVER hardcoded. This is the only file
// that touches the SDK's construction, so config stays isolated.

import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

let modelInstance = null;

// Default model kept here so swapping (e.g. gemini-2.5-flash-lite for cost,
// gemini-1.5-flash for balance) is a one-line change.
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export function getGeminiModel() {
  if (modelInstance) return modelInstance; // reuse across the app

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to your .env (never commit it)."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  modelInstance = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    // Ask the model to always answer with JSON so parsing is reliable.
    generationConfig: { responseMimeType: "application/json" },
  });

  return modelInstance;
}
