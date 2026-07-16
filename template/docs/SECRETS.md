# Secrets

1Password is the human source of truth for external credentials. Copy `.env.op.example` to ignored `.env.op`, update item references, sign in with `op signin`, then run:

```bash
op run --env-file=.env.op -- pnpm dev
```

For simple local development, `pnpm setup` creates ignored `.env` from `.env.example` only when it is missing and generates a fresh local Better Auth secret. It never overwrites existing environment files.

Use Railway Variables in deployment. Set `DATABASE_URL` with a PostgreSQL service reference such as `${{Postgres.DATABASE_URL}}`, generate `BETTER_AUTH_SECRET` in Railway, and set public URLs after the Railway domain exists. Do not seal variables during early iteration. Never put server secrets in `VITE_*` variables.
