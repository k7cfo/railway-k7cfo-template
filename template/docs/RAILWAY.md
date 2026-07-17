# Deploy to Railway

1. Run `pnpm verify`, then put the generated app in a Git repository you control and create a Railway project from it.
2. Add a Railway PostgreSQL service.
3. On the web service, set `DATABASE_URL=${{Postgres.DATABASE_URL}}` (adjust the service name if needed).
4. Generate `BETTER_AUTH_SECRET` as a Railway variable with at least 32 random bytes.
5. Generate a public Railway domain, then set `BETTER_AUTH_URL` and `APP_URL` to its HTTPS URL. Keep `AUTH_IP_HEADER=x-real-ip`; Railway overwrites that header with the client address, so Better Auth can rate-limit each client instead of using a shared fallback bucket.
6. Leave AI, Resend, S3/R2, and Stripe keys empty until those providers are intentionally configured.
7. Railway builds `Dockerfile`, runs `node --import tsx scripts/migrate.ts` as the pre-deploy command, and checks `/health`. The direct Node command uses the production-installed `tsx` package and avoids downloading pnpm during a deployment; continue to use `pnpm db:migrate` locally.
8. In the Railway service settings, enable **Wait for CI**. Railway will then skip a deployment when the repository's GitHub quality workflow fails.
9. Verify `/health`, `/ready`, registration, onboarding, and a nested SPA route after deployment.

Application code contains no Railway APIs. The same image can run on Cloud Run, AWS/Azure container products, Fly.io, Render, or a generic Docker host with `PORT`, URLs, authentication secret, and PostgreSQL configured. On another host, set `AUTH_IP_HEADER` only to a client-IP header that its trusted edge overwrites; accepting a client-controlled header would let attackers evade authentication rate limits.
