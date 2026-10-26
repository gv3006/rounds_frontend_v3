# Rounds — Agent Instructions

## Project
Rounds is a platform for discovering, evaluating, discussing, and collaborating on medical and scientific research. The experience should feel polished, credible, fast, and easy to navigate.

## General rules
- Read the relevant existing code before editing. Follow the project's established patterns, naming, and tooling.
- Make the smallest clean change that fully addresses the request. Avoid unrelated refactors, unnecessary dependencies, and premature abstractions.
- Prioritize responsive design, accessibility, clear information hierarchy, and consistent visual styling. Avoid generic-looking UI and decorative clutter.
- Keep components maintainable, typed where applicable, and reasonably reusable. Handle loading, empty, and error states when relevant.
- Do not invent real papers, citations, statistics, or user activity. Clearly distinguish demo/mock content from real data.
- Focus on the requested scope; do not add backend services, authentication, or integrations unless explicitly asked.

## Project tooling
- Vite + TypeScript. Scripts: `npm run dev`, `npm run typecheck`, `npm test` (Vitest), `npm run build`.
- All Rounds data goes through `api` (`src/api`); never read or write `localStorage` or call the Rounds backend directly from UI code. New data needs a `RoundsApi` method, both adapters (`mock.ts`, `http.ts`), types in `src/types`, and an entry in `docs/openapi.yaml`.

## Mandatory quick check — after EVERY task
Before reporting a task as finished, **verify your work**, even for small changes:
1. Review your diff for mistakes, accidental deletions, unrelated changes, and obvious bugs; run `git diff --check` when Git is available.
2. Run the **fastest relevant existing check** for what changed (for example, a targeted test, lint check, or TypeScript check). Use commands defined by the project rather than assuming scripts exist.
3. For UI changes, sanity-check the affected interaction and responsive layout in a browser if one is available. For larger or riskier changes, also run the appropriate broader checks (tests/build).
4. If a check fails, fix issues introduced by your changes and rerun it. Do not silently ignore failures or claim a check passed if it did not run.

Keep verification proportionate: don't run an entire test suite for a copy change, but **never skip the quick check**. If a check cannot be run, say why.

## Response after each task
Briefly report what changed, which checks passed, and any outstanding issues or unverified behavior. Keep this concise.
