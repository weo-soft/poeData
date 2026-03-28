# Agent and contributor guide

This document helps human contributors and coding agents work effectively in this repository.

## What this project is

**poeData** is a static, client-side web app (Vite + vanilla JavaScript) for browsing Path of Exile item data: categories, stash-style grids, datasets, MLE/Bayesian drop-weight estimates, and submission flows (EmailJS). Production builds are deployed to GitHub Pages ([PoeData.dev](https://PoeData.dev)).

## Commands

| Command | Purpose |
|--------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server (default port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest unit tests |
| `npm run test:coverage` | Unit tests with coverage |
| `npm run test:e2e` | Playwright E2E (expects app reachable; default base URL `http://localhost:5173`) |
| `npm run lint` / `npm run lint:fix` | ESLint on `src/` |
| `npm run calculate-weights` | Regenerate `public/data/**/calculations/mle.json` and `bayesian.json` from datasets |

Run `npm test -- --run` in CI-style mode (no watch), as in `.github/workflows/deploy.yml`.

## Repository layout (high signal)

- **`src/`** — Application code: `main.js` (bootstrap + router), `pages/`, `components/`, `services/` (`dataLoader.js`, routing, email), `visualization/`, `forms/`, `utils/`, `models/`.
- **`public/data/`** — Category JSON, datasets, and precomputed calculations. This is the source of truth for item lists and contributor datasets.
- **`public/contributions/`** — Contribution guide HTML and `index.json` metadata for which categories have tailored guides.
- **`scripts/calculate-weights.js`** — Node script that writes calculation JSON; keep logic aligned with `vite-plugin-calculations.js` when changing discovery or weight pipelines.
- **`vite-plugin-calculations.js`** — During `npm run dev`, can generate missing `mle.json` / `bayesian.json` on demand from datasets.

## Routing

The app uses **hash routing** (e.g. `#/category/scarabs`, `#/submit`). Handlers live in `src/main.js` via the router service.

## Categories: IDs vs `public/data` folders

Route and UI category IDs are **kebab-case** where applicable. On disk, folders often use **camelCase** or mixed names.

| UI `categoryId` | Primary item JSON path under `public/data/` |
|-----------------|---------------------------------------------|
| `scarabs` | `scarabs/scarabs.json` |
| `divination-cards` | `divinationCards/divinationCards.json` |
| `breach` | Merges `breachstones/breachStones.json` + `breachSplinter/breachSplinter.json` |
| `breach-splinters` | `breachSplinter/breachSplinter.json` |
| `breachstones` | `breachstones/breachStones.json` |
| `catalysts` | `catalysts/catalysts.json` |
| `delirium-orbs` | `deliriumOrbs/deliriumOrbs.json` |
| `essences` | `essences/essences.json` |
| `fossils` | `fossils/fossils.json` |
| `legion` | Merges `legionSplinters/legionSplinters.json` + `legionEmblems/legionEmblems.json` |
| `legion-splinters` | `legionSplinters/legionSplinters.json` |
| `legion-emblems` | `legionEmblems/legionEmblems.json` |
| `oils` | `oils/oils.json` |
| `tattoos` | `tattoos/tattoos.json` |
| `runegrafts` | `runegrafts/runegrafts.json` |
| `contracts` | `contracts/contracts.json` |

Authoritative static list for navigation: **`CATEGORY_LIST` in `src/services/dataLoader.js`**. If you add a category, update that list and wire `getCategoryFilename`, dataset paths, any merged-category logic, the Vite calculations plugin map, and `scripts/calculate-weights.js` mappings as needed.

## Datasets and calculations

- Datasets live under `public/data/<dir>/dataset/` or `public/data/<dir>/datasets/`, often with an `index.json` listing files.
- **`calculations/bayesian.json`** and **`calculations/mle.json`** are merged into items at load time (see `mergeWeightsFromCalculations` in `dataLoader.js`). Not every category has calculation files; `getCalculationDirectory` defines which do.

## Environment variables (EmailJS)

Copy **`.env.example`** to **`.env.local`** (gitignored) and set your values. Required keys: `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_TEMPLATE_ID`. Optional per-flow template overrides are listed in `.env.example`.

GitHub Actions production build injects the first three from repository **Variables** (see `.github/workflows/deploy.yml`).

## Conventions for changes

- **Match existing patterns**: ES modules, plain DOM APIs, existing file roles (`services/`, `pages/`, etc.).
- **Data changes**: Prefer validating JSON structure against how `dataLoader` and dataset loaders expect arrays and IDs.
- **Tests**: Add or extend tests under `tests/unit/` or `tests/integration/` when behavior is non-trivial; keep Playwright tests passing for responsive flows if you touch layout or navigation.
- **Scope**: Avoid unrelated refactors in the same change as a focused fix or feature.

## License

MIT — see [`LICENSE`](LICENSE) in the repository root.
