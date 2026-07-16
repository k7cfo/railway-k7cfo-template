# Decisions

Record dated, non-obvious product and technical decisions here.

## Initial decisions

- Use a modular monolith with a separately built React directory served by the same Hono process.
- Keep roles and personas separate.
- Keep optional services behind small provider interfaces and report configuration state honestly.
- Keep personal workspaces even when team UI is hidden.
