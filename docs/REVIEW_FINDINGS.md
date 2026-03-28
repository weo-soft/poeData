# Review findings (handoff)

Shared **handoff log** for multi-agent workflows. By default it lives at `docs/REVIEW_FINDINGS.md`; teams may use another path if the orchestrator declares it.

**Project overview and commands:** read **[`AGENTS.md`](../AGENTS.md)** at the repo root **before** any agent pass; it is the canonical structure and quality brief and should be attached or in context when sessions start.

| Role | Playbook | Writes here |
|------|-----------|-------------|
| **Review agent** | [REVIEW_AGENT.md](./REVIEW_AGENT.md) | **Review session** headers; **Finding** entries with `Status: open` |
| **Senior developer agent** | [SENIOR_DEVELOPER_AGENT.md](./SENIOR_DEVELOPER_AGENT.md) | **Resolution** blocks; **Status** → `resolved`, `partial`, or `wontfix`; optional **Developer session** notes |
| **Orchestrator agent** | [ORCHESTRATOR_AGENT.md](./ORCHESTRATOR_AGENT.md) | **Orchestrator run** summaries between rounds |

Append new content **below** this introduction; keep history—do not delete prior sessions unless a human explicitly archives the file.

---

<!-- New content starts below -->

## Orchestrator run — 2026-03-28 (planning)

- **Human goal:** Review application structure, code quality, refactoring and improvement potential (whole app).
- **Scope:** Whole app (`src/`, supporting scripts, data layout per AGENTS.md).
- **Severity policy:** Resolve `blocker`, `high`, and `medium`; `low` / `suggestion` optional.
- **Quality gate:** `npm test -- --run` && `npm run lint` — initial: **tests pass**; **lint fail** (8 errors, 78 warnings).
- **Round:** 0 / max 5
- **Actions this round:** Intake recorded; AGENTS.md used as project brief; baseline gate captured.
- **Open findings remaining:** To be filed in Review session 2026-03-28 (Round 1).
- **Next step:** Review agent pass (Phase 2); then developer fixes in-policy findings.

---

## Review session — 2026-03-28

- **Target:** `main` (workspace HEAD)
- **Scope:** Whole app — `src/`, routing, data/services, visualization, forms; cross-check with `AGENTS.md` layout.
- **Checks:** `npm test -- --run` — pass; `npm run lint` — **fail** (8 ESLint errors from `eslint:recommended`; 78 project warnings mostly `no-unused-vars` / `no-console`).
- **Summary:** Architecture matches the documented split (`main.js` + hash router, `pages/`, `services/dataLoader.js`, `public/data/`). Test coverage is solid for calculators, renderers, and integration flows. **Lint errors** in `bayesianMcmc.js` (`no-constant-condition`) and `divinationCardRenderer.js` (`no-useless-escape`) break the quality gate and should be fixed first. Large page modules (e.g. `categoryView.js`) and widespread console/debug leftovers are maintainability drag but are tracked as suggestions unless escalated. No separate `blocker`/`high`/`medium` correctness bugs filed beyond the gate-breaking lint issues in this pass.

### [RV-2026-03-28-01] ESLint errors break `npm run lint` (quality gate)

| Field | Value |
|--------|--------|
| **Severity** | `blocker` |
| **Area** | DX, build hygiene |
| **Location** | `src/services/bayesianMcmc.js` (~line 46, `while (true)` → `no-constant-condition`); `src/visualization/divinationCardRenderer.js` (~line 568, character-class escapes → `no-useless-escape`) |
| **Status** | `resolved` |

**Finding**  
`npm run lint` exits non-zero due to eight ESLint **errors** (not warnings). CI and the orchestrator stop condition require a green lint run.

**Improvement**  
- `sampleGamma`: replace `while (true)` with a form accepted by the linter (e.g. `for (;;)` with a comment, or a `while (!accepted)` refactor, or a targeted `eslint-disable-next-line` with a one-line rationale for the rejection-sampling loop).  
- `formatFlavourText`: remove unnecessary escapes inside the regex character classes while preserving the intended character set (including `[` / `]` if needed via placement or `\]`).

**Verification**  
`npm run lint` — zero errors; `npm test -- --run` unchanged green.

**Resolution** (2026-03-28)

- **Outcome:** `resolved`
- **Changes:** `sampleGamma` now uses `for (;;)` with a short comment (Marsaglia–Tsang rejection loop). `formatFlavourText` regexes updated to `/^\s*[[{('"]+/` and `/[\]})'"]+\s*$/` to drop useless escapes while keeping bracket/brace/paren/quote stripping behavior.
- **Verification:** `npm run lint` — 0 errors (78 warnings unchanged); `npm test -- --run` — 340 tests passed.

---

### Minor notes (no ID required)

- **Suggestion:** Consider chipping away at `no-unused-vars` / `no-console` warnings or tightening scope in `.eslintrc.cjs` for intentional debug paths — optional per human policy.
- **Suggestion:** Long-term refactor: split `categoryView.js` into smaller modules (datasets tab, weights, contribution section) to ease navigation and review.
- **Suggestion:** `contributions.js` / `categoryView.js` assign `innerHTML` from loaded HTML; content is repo-controlled today — if any path ever mixes user input, prefer sanitization or `createElement` text nodes.

---

## Orchestrator run — 2026-03-28 (after Round 1 review)

- **Human goal:** (same as planning)
- **Scope:** Whole app
- **Severity policy:** Resolve blocker, high, medium; suggestions optional
- **Quality gate:** `npm test -- --run` && `npm run lint` — after review: tests green, lint red (errors above)
- **Round:** 1 / max 5
- **Actions this round:** Review session appended; finding **RV-2026-03-28-01** opened (`blocker`).
- **Open findings remaining:** RV-2026-03-28-01 (`blocker`)
- **Next step:** Senior developer pass — resolve RV-2026-03-28-01; re-run quality gate.

---

## Developer session — 2026-03-28

- **Addressed finding IDs:** RV-2026-03-28-01
- **Deferred:** none
- **Final checks:** `npm run lint` — pass (0 errors); `npm test -- --run` — pass

---

## Review session — 2026-03-28 (verification)

- **Target:** `main` (post-fix workspace)
- **Scope:** Regressions and touched areas — `src/services/bayesianMcmc.js` (`sampleGamma`), `src/visualization/divinationCardRenderer.js` (`formatFlavourText`).
- **Checks:** `npm test -- --run` — pass; `npm run lint` — pass (warnings only, no errors).
- **Summary:** No new in-policy findings. Gamma sampling loop semantics unchanged (still rejection sampling until accept). Flavour-text cleaner still strips angle-bracket markup then leading/trailing bracket-like punctuation; regex is simpler and ESLint-clean. Remaining lint output is pre-existing warning debt (`no-unused-vars`, `no-console`), out of scope for mandatory resolution per human policy.

---

## Orchestrator run — 2026-03-28 (closure)

- **Human goal:** (unchanged)
- **Scope:** Whole app
- **Severity policy:** Resolve blocker, high, medium; suggestions optional
- **Quality gate:** `npm test -- --run` && `npm run lint` — **green** (lint: 0 errors)
- **Round:** 1 / max 5 (single review → fix → verify cycle)
- **Actions this round:** Developer resolved RV-2026-03-28-01; verification review found no new blocker/high/medium items.
- **Open findings remaining:** none per policy (RV-2026-03-28-01 `resolved`; minor notes remain suggestions only)
- **Next step:** Stop — criteria met

---
