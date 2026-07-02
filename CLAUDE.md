# Food Tracker — working agreement

## Git workflow
- **Do NOT `git commit` or `git push` unless I explicitly ask.** Stage/prepare
  changes and show me what you'd commit, then wait for my go-ahead.

## Project
Firebase-backed PWA (Google login + Firestore per-user sync). React + Vite +
Tailwind v4; source in `src/`, static assets in `public/`, build output in
`dist/` (gitignored). `npm run dev` to develop, `npm run build` to build.
Deploys via GitHub Actions to Firebase Hosting on push to `master` (see
`.github/workflows/`). See `SETUP.md` for the one-time Firebase/pipeline
setup. Repo: private GitHub `Boris89-glitch/food-tracker`.
