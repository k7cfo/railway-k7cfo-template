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

When a deployment uses Tailscale, run `pnpm tailscale:check` after starting the app through Tailscale. It repeats the health, readiness, anonymous-authentication, and SPA checks through the private HTTPS URL. This live check is intentionally separate from `pnpm verify` because CI must not require membership in the owner's tailnet.

Run `pnpm setup` once before the first verification so PostgreSQL and local configuration are available. Run `pnpm verify` after meaningful changes and immediately before a manual deployment. It does not deploy or change remote infrastructure.

After a test deployment, run the same complete browser flow against its public URL before promoting it:

```bash
E2E_BASE_URL=https://your-test-domain.example pnpm test:e2e
```

Setting `E2E_BASE_URL` prevents Playwright from starting a local server. The flow creates disposable application records in the target database, so use a test deployment rather than production. Check `/health` and `/ready` separately, inspect deployment logs, and fix every failure before promotion.

## Keeping AI-generated code small

Biome catches unsafe and inconsistent code, TypeScript catches invalid assumptions, Vitest and Playwright catch behavior regressions, Knip catches unused files, dependencies, and duplicate exports, and the bundle budget catches accidental client-side bloat. The default budgets are 950 KB across all client JavaScript and 500 KB for any one chunk, so large page groups must remain lazy-loaded. Do not silence a finding simply to make the command green. Remove unnecessary code, fix the behavior, or document a narrowly scoped exception in `docs/DECISIONS.md`.

Prefer extending an existing module over adding a parallel helper. Add a dependency only when the platform and current packages cannot solve the problem clearly. Create shared abstractions after a second concrete use, not in anticipation of one.

## Automatic GitHub check

`.github/workflows/quality.yml` runs the same checks, builds the Docker image, and reports a GitHub check on every pull request and push to `main`. In Railway, enable **Wait for CI** for the service so a failed GitHub check skips the deployment. Keep branch protection enabled if collaborators can push changes.
