// ─────────────────────────────────────────────────────────────────────────
//  Firebase setup
//  1. Create a free project at https://console.firebase.google.com
//  2. Add a Web app, enable Authentication → Google, and Cloud Firestore.
//  3. Paste the config object it gives you below. These keys are meant to be
//     public — security is enforced by login + Firestore rules, not by hiding
//     them. See SETUP.md for the full walkthrough.
// ─────────────────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvxxJ13QeXxaYM4qFu_ZPSYjjvvse1HHM",
  authDomain: "food-tracker-ceb1d.firebaseapp.com",
  projectId: "food-tracker-ceb1d",
  storageBucket: "food-tracker-ceb1d.firebasestorage.app",
  messagingSenderId: "401810836927",
  appId: "1:401810836927:web:93485667695e406762a50a",
  measurementId: "G-XX984EWS6T",
};

export const CONFIGURED = !firebaseConfig.apiKey.startsWith("PASTE_");

export let auth = null;
export let db = null;

if (CONFIGURED) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}

// Kick off Google sign-in. Tries a popup first; if the environment blocks it
// (common in in-app browsers / privacy tools), falls back to a full redirect.
export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider).catch((e) => {
    if (
      e &&
      (e.code === "auth/popup-blocked" ||
        e.code === "auth/cancelled-popup-request" ||
        e.code === "auth/operation-not-supported-in-this-environment")
    ) {
      return signInWithRedirect(auth, provider);
    }
    throw e;
  });
}

// Completes a redirect-based sign-in when the app reloads after one.
export const completeGoogleRedirect = () =>
  CONFIGURED ? getRedirectResult(auth) : Promise.resolve(null);
