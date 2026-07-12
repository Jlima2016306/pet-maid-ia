// infrastructure/config/firebase.config.js
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "dotenv/config";

let dbInstance = null;

export function getFirestore() {
  if (dbInstance) return dbInstance;

  const keyPath = resolve(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./credentials/firebase-key.json"
  );

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
  } catch (err) {
    throw new Error(
      `Could not read Firebase key at "${keyPath}". ` +
      `Check GOOGLE_APPLICATION_CREDENTIALS in your .env and that the file exists. ` +
      `Original error: ${err.message}`
    );
  }

  // getApps() replaces admin.apps -- works correctly under ES modules.
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  dbInstance = getAdminFirestore();
  dbInstance.settings({ ignoreUndefinedProperties: true });

  return dbInstance;
}