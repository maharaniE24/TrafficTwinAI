import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "traffictwin-ai-tn"}.firebaseapp.com`,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "http://127.0.0.1:9000?ns=traffictwin-ai-tn-default-rtdb",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "traffictwin-ai-tn",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "traffictwin-ai-tn"}.appspot.com`,
  appId: "1:1234567890:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Connect to Local Firebase Emulators if configured
const useEmulator = import.meta.env.VITE_USE_EMULATOR !== "false";

if (useEmulator) {
  try {
    // Only connect if not already connected
    if (!window.__FIREBASE_EMULATORS_CONNECTED__) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectDatabaseEmulator(database, "127.0.0.1", 9000);
      window.__FIREBASE_EMULATORS_CONNECTED__ = true;
      console.log("[Firebase] Connected to local Emulators (DB: 9000, Auth: 9099)");
    }
  } catch (err) {
    console.warn("[Firebase] Emulator connection warning:", err);
  }
}

export { app, auth, database };
