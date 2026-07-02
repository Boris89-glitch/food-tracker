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
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
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
