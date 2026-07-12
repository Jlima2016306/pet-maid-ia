// infrastructure/config/firebase.config.js
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs"; // <-- Agregamos existsSync
import { resolve } from "node:path";
import "dotenv/config";

let dbInstance = null;

export function getFirestore() {
  if (dbInstance) return dbInstance;

  if (getApps().length === 0) {
    const keyPath = resolve(
      process.env.GOOGLE_APPLICATION_CREDENTIALS || "./credentials/firebase-key.json"
    );

    // 1. Verificamos si el archivo existe (Entorno Local)
    if (existsSync(keyPath)) {
      try {
        const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
        initializeApp({
          credential: cert(serviceAccount),
        });
        console.log("Firebase inicializado con credenciales locales.");
      } catch (err) {
        throw new Error(
          `Error al leer la clave de Firebase en "${keyPath}": ${err.message}`
        );
      }
    } 
    // 2. Si el archivo NO existe, asumimos que estamos en Cloud Run
    else {
      console.log("Archivo de credenciales no encontrado. Inicializando Firebase con Default Credentials (Cloud Run)...");
      // Al llamar initializeApp sin parámetros, Firebase detecta automáticamente 
      // la cuenta de servicio nativa de Google Cloud Run.
      initializeApp(); 
    }
  }

  dbInstance = getAdminFirestore();
  dbInstance.settings({ ignoreUndefinedProperties: true });

  return dbInstance;
}