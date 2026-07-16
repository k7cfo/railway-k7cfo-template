# Generated SaaS Application — Coding Agent Instructions

`AGENTS.md` is canonical. `CLAUDE.md` must remain a relative symlink to this file. These instructions apply to Codex and Claude Code.

## Start with product intent

Read `docs/PRODUCT.md` and `docs/DECISIONS.md` before changing code. Preserve existing SaaS capabilities unless the owner explicitly removes them. Record non-obvious assumptions and trade-offs in `docs/DECISIONS.md`.

When the owner asks to create a new product from this starter, first inspect the repository, then ask one plain-language question at a time—no more than eight meaningful questions total. Do not ask about frameworks or infrastructure already chosen here. Determine the primary user, buyer, main problem, first-session success, repeated workflow, personas, permissions/collaboration, billing/integrations/data sensitivity, branding, and launch scope. Combine related topics, use sensible defaults when the owner is uncertain, write a concise brief to `docs/PRODUCT.md`, generate the new app in a separate directory when working from the Copier source, and build the smallest complete workflow. Adapt onboarding, navigation, dashboard, personas, and data model. Do not ask for facts already present in the repository.

## Architecture

This is a TypeScript modular monolith: one repository, Node/Hono process, React/Vite SPA, PostgreSQL database, Docker image, public domain, and deployment pipeline. Hono serves `/api/*`, Better Auth under `/api/auth/*`, and `web/dist` with SPA fallback. Keep features cohesive in `src/` server modules and `web/src/` UI modules. Avoid microservices, extra databases, Redis, Kafka, GraphQL, tRPC, Kubernetes, and speculative framework layers.

New product features normally include:

- schema and committed migration in `src/db` and `drizzle`;
- server-side domain behavior and Hono route under `src`;
- React workflow under `web/src`, using the existing design tokens and shell;
- authorization, failure/empty/loading/success states, tests, and documentation.

## Security and data

Better Auth owns authentication tables and session behavior. Product profiles stay in `user_profiles`. Every new user receives a personal workspace, owner membership, preferences, and onboarding row. Every workspace read and mutation must verify membership server-side. Roles (`owner`, `admin`, `member`, `support`) grant permissions; personas only adapt language, onboarding, dashboard content, and navigation. Never rely on a browser guard for authorization. Never expose secrets, password hashes, session tokens, complete credentials, or provider keys.

Use collision-resistant IDs, foreign keys, unique constraints, useful indexes, timestamps, and transactions for multi-step changes. Add a migration for every schema change. Never run seeds automatically in production; `db:reset` must keep its production refusal.

## Design and provider boundaries

Preserve the selected Nothing, Apex, or Onyx visual character and keep all three token systems available. Prefer the existing shadcn/Radix components and semantic tokens. Build complete workflows, not inert cards; no fake buttons or fake connected states. Important pages need mobile behavior, keyboard access where relevant, and honest loading, empty, error, and success feedback.

AI, email, object storage, jobs, billing, and analytics SDKs belong behind `src/services/*` interfaces. Never import provider SDKs in React, API route modules, or product domain modules. Optional providers must degrade gracefully when unconfigured.

## Secrets

Use 1Password as the human source of truth, `op run --env-file=.env.op -- pnpm dev` for injection, local ignored `.env` for safe development, and Railway Variables for deployment. Never commit real values or use `VITE_*` for server secrets. Update `.env.example` whenever configuration changes, showing names and safe placeholders only.

## Commands and definition of done

Use pnpm. Key commands: `pnpm setup`, `pnpm doctor`, `pnpm dev`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm check`, `pnpm test:e2e`, `pnpm deploy:check`, `pnpm build`, and `pnpm start`.

Before completion: build the smallest complete product workflow; remove fake actions; add migrations; update `.env.example`, tests, `docs/PRODUCT.md`, and other affected docs; record assumptions; run `pnpm check`, Playwright, migration/seed checks, a production-server health/readiness/SPA smoke test, and a Docker build. Preserve all reusable SaaS capabilities and leave the app ready for Railway.
