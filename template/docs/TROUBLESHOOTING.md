# Troubleshooting

Run `pnpm doctor` first. If PostgreSQL is unavailable, run `docker compose up -d postgres` and inspect `docker compose logs postgres`. If migration state is stale, run `pnpm db:migrate`; for disposable local data only, run `pnpm db:reset` (it refuses production).

If ports 3000 or 5173 are occupied, stop the existing development process or change local ports consistently. If authentication redirects unexpectedly, confirm `BETTER_AUTH_URL`, `APP_URL`, cookies, and system time. If an integration says unconfigured, add its server-side variables and restart; never add provider keys under `VITE_*`.

For production, inspect Railway deployment logs, confirm the database reference variable, and check `/ready`. `/health` proves the process responds; `/ready` additionally proves database connectivity.
