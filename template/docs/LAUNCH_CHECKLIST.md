# Launch checklist

- Replace placeholders in product brief, terms, privacy, and contact pages.
- Review roles, invitations, registration mode, personas, and first-session workflow.
- Run `pnpm verify`; fix every failure instead of bypassing a rule.
- Confirm the GitHub **Quality gate** check passed and Railway **Wait for CI** is enabled.
- Test migrations against a database backup and test rollback by redeploying the last known-good image.
- Configure public URLs and a fresh authentication secret.
- Configure only required providers and verify honest failure states.
- Review email sender/domain, storage durability, Stripe products/prices/webhook, and data retention if enabled.
- Test mobile navigation, keyboard use, 404/error pages, account recovery, support, and admin authorization.
- Deploy into a clean Railway project and verify `/health`, `/ready`, and SPA fallback.
- If private Tailscale access is part of the launch, review tailnet grants and run `pnpm tailscale:check` from an authorized device.
