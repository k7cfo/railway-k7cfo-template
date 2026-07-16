# Decisions

Record dated, non-obvious product and technical decisions here.

## Initial decisions

- Use a modular monolith with a separately built React directory served by the same Hono process.
- Keep roles and personas separate.
- Keep optional services behind small provider interfaces and report configuration state honestly.
- Keep personal workspaces even when team UI is hidden.
- Treat analytics and jobs provider modules as intentional Knip entry points until a product uses them. Knip ignores dependencies referenced only from CSS and the preserved reusable UI component directory because static dependency analysis cannot see those imports reliably; all exceptions are centralized in `knip.json`.
- Keep Tailscale optional and outside the application container. Host-level Tailscale Serve provides private HTTPS with less privilege and state than embedding `tailscaled`; the app retains Better Auth, exact trusted origins, and cloud portability. A live tailnet smoke check remains separate from provider-neutral CI.
- Resolve Better Auth client addresses through one explicitly trusted proxy header. Railway's documented, overwritten `X-Real-IP` is the default; other hosts must select their own edge-sanitized header rather than trusting an arbitrary forwarded chain.
