# Deploy to Railway

1. Put the generated app in a Git repository you control and create a Railway project from it.
2. Add a Railway PostgreSQL service.
3. On the web service, set `DATABASE_URL=${{Postgres.DATABASE_URL}}` (adjust the service name if needed).
4. Generate `BETTER_AUTH_SECRET` as a Railway variable with at least 32 random bytes.
5. Generate a public Railway domain, then set `BETTER_AUTH_URL` and `APP_URL` to its HTTPS URL.
6. Leave AI, Resend, S3/R2, and Stripe keys empty until those providers are intentionally configured.
7. Railway builds `Dockerfile`, runs `pnpm db:migrate` as the pre-deploy command, and checks `/health`.
8. Verify `/health`, `/ready`, registration, onboarding, and a nested SPA route after deployment.

Application code contains no Railway APIs. The same image can run on Cloud Run, AWS/Azure container products, Fly.io, Render, or a generic Docker host with `PORT`, URLs, authentication secret, and PostgreSQL configured.
