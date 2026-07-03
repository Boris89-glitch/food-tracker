# Food Tracker — working agreement

## Git workflow
- **Always `git commit` AND `git push` once a change is ready** — don't wait for
  me to ask. Pushing to `master` triggers the deploy, and I need finished
  changes live on my phone right away.

## Verification
- **Don't verify UI changes in the preview server — I'll test myself.** Skip
  `preview_start` and the whole preview/drag-simulation workflow. Just make the
  code change and describe what it does.

## Project
Firebase-backed PWA (Google login + Firestore per-user sync). React + Vite +
Tailwind v4; source in `src/`, static assets in `public/`, build output in
`dist/` (gitignored). `npm run dev` to develop, `npm run build` to build.
Deploys via GitHub Actions to Firebase Hosting on push to `master` (see
`.github/workflows/`). See `SETUP.md` for the one-time Firebase/pipeline
setup. Repo: private GitHub `Boris89-glitch/food-tracker`.
