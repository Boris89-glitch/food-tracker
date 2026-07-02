// ─────────────────────────────────────────────────────────────────────────
//  Firebase setup
//  1. Create a free project at https://console.firebase.google.com
//  2. Add a Web app, enable Authentication → Google, and Cloud Firestore.
//  3. Paste the config object it gives you below. These keys are meant to be
//     public — security is enforced by login + Firestore rules, not by hiding
//     them. See SETUP.md for the full walkthrough.
// ─────────────────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
