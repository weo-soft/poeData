# Security

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

Instead, use [GitHub Security Advisories](https://github.com/weo-soft/poeData/security/advisories/new) for this repository (private report to maintainers), or contact the maintainers through a non-public channel if you cannot use that form.

Include enough detail to reproduce or understand the issue (affected paths, versions, and steps if applicable). We will treat reports in good faith and coordinate disclosure after a fix is available where reasonable.

## Scope notes

This is a static client-side app (Vite + browser). Typical concerns include XSS in user-controlled content, unsafe handling of imported data, and dependency issues. Secrets for production builds belong in GitHub Actions variables or local `.env.local`, not in the repository.
