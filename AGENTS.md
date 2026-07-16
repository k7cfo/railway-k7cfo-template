# railway-k7cfo-template Maintainer Instructions

This repository is a Copier template, not the generated application. `AGENTS.md` is canonical and `CLAUDE.md` must remain a relative symlink to it.

Read `copier.yml`, then work under `template/`. Files ending in `.jinja` are rendered; other files are copied verbatim. Preserve the upstream Nothing, Apex, and Onyx design systems, font choices, tokens, motion components, and shadcn/Radix foundations.

Keep the generated product a TypeScript modular monolith: one Hono/React container, one PostgreSQL database, one domain, and one pipeline. Keep provider SDKs behind `template/src/services/*`; never put Cloudflare/Railway bindings in business logic or server secrets in `VITE_*` variables.

After changes, generate a disposable project with Copier and verify installation, setup, migration, seed, `pnpm check`, `pnpm test:e2e`, production server health/readiness/SPA fallback, non-root Docker build/runtime, and tracked-secret checks. Never commit a generated smoke app, real secret, or environment file. Preserve `.copier-answers.yml`, the generated marker, and the generated `CLAUDE.md → AGENTS.md` symlink.
