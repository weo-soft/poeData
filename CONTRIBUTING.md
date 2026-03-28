# Contributing

Thanks for helping improve PoeData.

## Where to start

- **Repository layout, category IDs, scripts, and tests** are documented in [AGENTS.md](AGENTS.md). Read that first before larger changes.
- **Data** lives under `public/data/`. When you change datasets or item JSON, run `npm run calculate-weights` if you want committed `mle.json` / `bayesian.json` artifacts updated (see AGENTS.md).

## Workflow

1. Open an issue or PR describing the change (small fixes can go straight to a PR).
2. Branch from `main`, make focused commits.
3. Run checks locally:

   ```bash
   npm test -- --run
   npm run lint
   npm run build
   ```

   For UI or navigation changes, `npm run test:e2e` is recommended (app reachable at `http://localhost:5173` by default).

4. Open a pull request against `main`.

## Style

- Match existing patterns: ES modules, plain DOM APIs, file roles under `src/` as in AGENTS.md.
- Avoid unrelated refactors in the same PR as a feature or fix.

## EmailJS / local setup

Submission features need EmailJS variables in `.env.local`; see [.env.example](.env.example) and [README.md](README.md). Missing env is fine for most data or UI work.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.
