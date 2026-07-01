# Food Tracker — setup & deploy

The app is a Progressive Web App (PWA) that uses **Firebase** for Google login,
per-user cloud storage, and hosting. Follow these one-time steps to make it live.
Everything below is free at this scale.

> Until you paste your Firebase config (Step 3), the app still runs in
> **local-only mode** (data stays on the one device, no login). Fill in the
> config to unlock Google sign-in + cross-device sync.

---

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `food-tracker`), accept defaults, create it.

## 2. Enable the two services

**Authentication**
1. Left menu → **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Google** → enable → pick a support email → **Save**.

**Cloud Firestore**
1. Left menu → **Build → Firestore Database → Create database**.
2. Start in **production mode** (our `firestore.rules` locks it down properly).
3. Pick a location close to you → **Enable**.

## 3. Add a Web app & copy the config

1. Project **Overview** (gear icon) → **Project settings** → scroll to **Your apps**.
2. Click the **web** icon `</>`, give it a nickname, **Register app**.
3. Copy the `firebaseConfig = { ... }` object it shows you.
4. Open [`public/index.html`](public/index.html), find the `firebaseConfig` block
   near the top of the `<script type="module">` and replace the `PASTE_...`
   placeholders with your real values.

> These keys are **safe to commit publicly** — Firebase web API keys just identify
> the project. Actual security comes from the login + `firestore.rules`.

## 4. Install the Firebase CLI & log in

```bash
npm install -g firebase-tools
firebase login
```

## 5. Point this folder at your project

From the `food_tracker` folder:

```bash
firebase use --add        # pick the project you created, alias it "default"
```

This creates a `.firebaserc` file (safe to commit).

## 6. Deploy

```bash
firebase deploy --only firestore:rules,hosting
```

You'll get a live URL like `https://food-tracker-xxxx.web.app`. Open it, click
**Continue with Google**, and you're in. Log in on your phone with the same
Google account → same data.

## 7. Add to your phone's home screen

- **Android (Chrome/Brave):** open the URL → menu (⋮) → **Install app** / **Add to Home screen**.
- **iPhone (Safari):** open the URL → Share → **Add to Home Screen**.

It launches full-screen with its own icon — no address bar.

---

## Data model

Each signed-in user has one Firestore document at `users/{uid}`:

```
{ foods: [...], logs: {date: [entries]}, goal: 2000, weight: {date: kg}, unit: "kg" }
```

Writes are debounced and mirrored to `localStorage`, so the app is instant and
works offline; Firestore syncs the moment you're back online.
