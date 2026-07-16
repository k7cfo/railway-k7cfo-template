# Quality and smoke testing

The repository has one pre-deployment command:

```bash
pnpm verify
```

It stops at the first failure. It checks formatting, Biome lint rules, strict TypeScript, unit and API tests, unused files and dependencies, the production build and client JavaScript size budget, the complete Playwright browser flow on desktop and mobile, a compiled-production-server smoke test, deploy artifacts, and tracked secret files.

The smoke test starts the compiled Hono/React application on a temporary local port and verifies:

- `/health` answers;
- `/ready` can reach PostgreSQL;
- a protected API rejects an anonymous request;
- a nested client-side route returns the compiled SPA.

Run `pnpm setup` once before the first verification so PostgreSQL and local configuration are available. Run `pnpm verify` after meaningful changes and immediately before a manual deployment. It does not deploy or change remote infrastructure.

## Keeping AI-generated code small

Biome catches unsafe and inconsistent code, TypeScript catches invalid assumptions, Vitest and Playwright catch behavior regressions, Knip catches unused files, dependencies, and duplicate exports, and the bundle budget catches accidental client-side bloat. Do not silence a finding simply to make the command green. Remove unnecessary code, fix the behavior, or document a narrowly scoped exception in `docs/DECISIONS.md`.

Prefer extending an existing module over adding a parallel helper. Add a dependency only when the platform and current packages cannot solve the problem clearly. Create shared abstractions after a second concrete use, not in anticipation of one.

## Automatic GitHub check

`.github/workflows/quality.yml` runs the same checks, builds the Docker image, and reports a GitHub check on every pull request and push to `main`. In Railway, enable **Wait for CI** for the service so a failed GitHub check skips the deployment. Keep branch protection enabled if collaborators can push changes.
