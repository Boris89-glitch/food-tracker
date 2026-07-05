# Food Tracker — working agreement

## Output style
- **Be concise.** Explain in a few lines max. Skip the trailing wind-downs — the "one flag worth noting…", "a couple things to keep in mind…", option-survey closers. State what was done or found, then stop.
- Still call out the genuinely important: risky/irreversible actions, real bugs, and decisions that need my input. Trim filler, keep substance.
- **One line, always.** Every user-visible message is a single line — the final answer AND any text before/around tool calls. No preamble ("Let me…", "The cause is…"), no mid-work narration, no reasoning, no reporting, no breakdowns. Do the work silently via tools, then print one line stating what was done or found. If I truly need to explain something complex or ask a question, that too is as short as possible — but default to one line.

## Git workflow
- **Always `git commit` AND `git push` once a change is ready** — don't wait for
  me to ask. Pushing to `master` triggers the deploy, and I need finished
  changes live on my phone right away.
- Commit straight to `master` — no feature branch, no PR, no `gh pr merge`.

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
