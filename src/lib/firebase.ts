import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

let app: FirebaseApp | null = null;
export let firebaseAuth: Auth | null = null;
export let db: Firestore | null = null;
export let isFirebaseEnabled = false;

export function initializeFirebase(config: FirebaseConfig) {
  if (app) return; // already initialized
  
  if (config.apiKey && config.projectId) {
    isFirebaseEnabled = true;
    app = getApps().length ? getApps()[0] : initializeApp(config);
    firebaseAuth = getAuth(app);
    db = getFirestore(app);
  }
}
