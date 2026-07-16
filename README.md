# Portable SaaS Template

A Railway-first, cloud-portable Copier template for generating a polished modular-monolith SaaS application. Each generated app runs a Hono API and React SPA together in one Node.js container, backed by PostgreSQL.

This project was derived from [knowsuchagency/cloudflare-template](https://github.com/knowsuchagency/cloudflare-template). Its Nothing, Apex, and Onyx design systems, shadcn/Radix components, typography, and visual character are retained. The upstream repository did not include a standalone license file at import time; see `docs/UPSTREAM.md` for provenance. Existing upstream notices remain intact.

## Generate an application

```bash
uvx copier copy --trust /absolute/path/to/portable-saas-template /absolute/path/to/new-app
```

Or:

```bash
./bin/new-app /absolute/path/to/new-app
```

Then run `pnpm setup` and `pnpm dev` in the generated app. See `OWNER_GUIDE.md` in the generated project.

## Develop the template

The renderable project is in `template/`. Files ending in `.jinja` are rendered by Copier; other files are copied as-is. Generate a disposable app before committing template changes:

```bash
uvx copier copy --trust --defaults --data project_slug=smoke-test . /tmp/smoke-test
```
