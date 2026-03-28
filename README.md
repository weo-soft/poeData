# Path of Exile Item Data Browser

A static web application that provides detailed data and visualizations for Path of Exile item categories. Browse categories, view items in stash tab–style visualizations, access raw JSON data, and submit new item data.

**Live site:** [PoeData.dev](https://PoeData.dev)

**Contributor / agent notes:** See [AGENTS.md](AGENTS.md) for repository layout, category ID conventions, scripts, and testing.

## Features

- **Browse categories**: Scarabs, Divination Cards, Breach (splinters + stones), Catalysts, Delirium Orbs, Essences, Fossils, Legion (splinters + emblems), Oils, Tattoos, Runegrafts, Contracts
- **Stash tab visualization**: Grid layout on HTML5 Canvas where applicable
- **List view**: Names and icons for categories that suit a list (e.g. tattoos, runegrafts)
- **Dual view**: Grid categories can show grid and list side by side, including calculated weights where available
- **Item details**: Per-item information
- **Statistics charts**: Trends and distributions (Chart.js)
- **Raw JSON**: Direct URLs under `/data/...` for programmatic use
- **Data submission**: Guided form, bulk import, and dataset wizard (EmailJS when configured)
- **Datasets**: Browse and download per-category datasets with metadata and sources
- **Weight calculations**: MLE weights from datasets; optional **Bayesian** estimates with uncertainty (client-side MCMC)
- **Contribution guide**: Category-specific or generic guidelines in `public/contributions/`

## Tech stack

- **Build**: Vite (`vite-plugin-calculations.js` can generate missing MLE/Bayesian JSON in dev)
- **Frontend**: Vanilla JavaScript (ES modules), HTML5, CSS3
- **Charts / canvas**: Chart.js, HTML5 Canvas
- **Forms**: EmailJS (`@emailjs/browser`)
- **Tests**: Vitest (unit), Playwright (E2E)
- **Stats**: simple-statistics

## Prerequisites

- Node.js 18+ (CI uses Node 20); npm
- A modern desktop or mobile browser (see mobile notes below)

## Mobile support

The UI is responsive and touch-oriented (e.g. minimum touch targets). To verify quickly: DevTools device emulation at 320px, 375px, 768px, 1024px; run `npm run test:e2e` for automated checks.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **EmailJS (optional)** — required for submission features to send mail:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your [EmailJS](https://www.emailjs.com) values (see comments in `.env.example`; every key must stay prefixed with `VITE_`). Optional per-flow template IDs are documented there.

   Restart the dev server after changing env files.

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   Default URL: `http://localhost:5173`

## Development

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Vitest |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Playwright |
| `npm run lint` / `npm run lint:fix` | ESLint on `src/` |
| `npm run calculate-weights` | Regenerate `mle.json` / `bayesian.json` under `public/data/**/calculations/` from datasets |

## Project structure

```
src/
├── models/          # Data models
├── services/        # Data loading, routing, email, validation
├── visualization/   # Canvas and charts
├── forms/           # Submission and import flows
├── pages/           # Route-level views
├── components/      # Navigation, dataset UI, etc.
├── utils/           # Helpers
└── main.js          # Entry + router registration

public/
├── data/            # Category JSON, datasets, calculations/
├── contributions/   # Contribution guide content
└── assets/          # Static assets

scripts/
└── calculate-weights.js   # Batch weight regeneration from datasets

tests/
├── unit/
├── integration/
└── fixtures/
```

## Data layout

Item arrays live under `public/data/<categoryFolder>/` (folder naming is not always the same as the URL `categoryId`; see [AGENTS.md](AGENTS.md)).

Examples:

- `public/data/scarabs/scarabs.json`
- `public/data/divinationCards/divinationCards.json`
- `public/data/contracts/contracts.json`

**Datasets**: `public/data/<folder>/dataset/` or `.../datasets/`, often with `index.json`.

**Precomputed weights**: `public/data/<folder>/calculations/mle.json` and `bayesian.json` (regenerate with `npm run calculate-weights` after dataset changes when you want committed artifacts).

## Direct JSON access

With the dev server or deployed site, examples include:

- `/data/scarabs/scarabs.json`
- `/data/breachSplinter/dataset/dataset1.json` or `/data/<folder>/datasets/dataset1.json`

## Deployment

The site deploys to **GitHub Pages** via `.github/workflows/deploy.yml` on pushes to `main` (and manual dispatch). The workflow runs `npm test -- --run`, then `npm run build`, and publishes `dist/`.

- **Custom domain**: `public/CNAME` (copied to `dist/` on build) — e.g. PoeData.dev
- **GitHub**: Repository **Settings → Pages** should use the GitHub Actions source; EmailJS-related build variables are set as repository **Variables** for the workflow

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). High-level developer notes: [AGENTS.md](AGENTS.md).

## Third-party content

*Path of Exile* and related names and imagery are trademarks or registered trademarks of Grinding Gear Games. This project is a **fan-made, community-driven** tool and is **not affiliated with or endorsed by** Grinding Gear Games. Game data and assets in `public/data/` and elsewhere are used for informational purposes; rights remain with their respective owners. The **source code** in this repository is licensed under the MIT License (see below); that license does not grant rights to GGG’s intellectual property.

## License

The project source code is licensed under the [MIT License](LICENSE).

See [SECURITY.md](SECURITY.md) for reporting security issues.
