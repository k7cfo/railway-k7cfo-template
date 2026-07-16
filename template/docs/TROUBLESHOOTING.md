# Troubleshooting

Run `pnpm doctor` first. If PostgreSQL is unavailable, run `docker compose up -d postgres` and inspect `docker compose logs postgres`. If migration state is stale, run `pnpm db:migrate`; for disposable local data only, run `pnpm db:reset` (it refuses production).

If `pnpm verify` fails, read the first failing section and fix that cause before rerunning it. Use the narrower command shown in the output (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm deadcode`, `pnpm test:e2e`, or `pnpm test:smoke`) while iterating. Do not add ignore patterns, disable rules, or delete a test merely to make the gate pass.

If ports 3000 or 5173 are occupied, stop the existing development process or change local ports consistently. If authentication redirects unexpectedly, confirm `BETTER_AUTH_URL`, `APP_URL`, cookies, and system time. If an integration says unconfigured, add its server-side variables and restart; never add provider keys under `VITE_*`.

For production, inspect Railway deployment logs, confirm the database reference variable, and check `/ready`. `/health` proves the process responds; `/ready` additionally proves database connectivity.
