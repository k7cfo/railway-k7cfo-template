# Tailscale

Tailscale is optional. The application does not require its SDK, daemon, or credentials and remains deployable on Railway and ordinary container platforms. The recommended setup runs Tailscale on the host and uses Tailscale Serve as a private HTTPS reverse proxy to the app's loopback port.

## Private development

Install Tailscale, sign in, and confirm `tailscale status` works. MagicDNS and HTTPS certificates must be enabled for the tailnet. Then run:

```bash
pnpm dev:tailscale
```

The command discovers this machine's MagicDNS name, configures persistent HTTPS Serve for `http://127.0.0.1:5173`, starts the normal API and Vite processes, and prints the private `https://…ts.net` URL. It passes only that exact hostname to Vite and adds exact local/private origins to Better Auth; it never allows arbitrary hosts.

Useful controls:

```bash
pnpm tailscale:status
pnpm tailscale:check
pnpm tailscale:off
```

`tailscale:check` verifies `/health`, database-backed `/ready`, anonymous API protection, and SPA fallback through the tailnet. `tailscale:off` removes this machine's HTTPS Serve endpoint on port 443; it does not sign the device out or reset unrelated Tailscale configuration.

If you use a stable Tailscale Service or need to override discovery, set `TAILSCALE_URL` to one exact HTTPS origin. Do not use a wildcard. `TAILSCALE_TARGET` can override the proxy target but is deliberately restricted to an HTTP(S) loopback URL.

## Private access to a production container

On a generic Docker host, bind the app only to host loopback and keep PostgreSQL private. Set `APP_URL` and `BETTER_AUTH_URL` to the private HTTPS URL before starting the container. Add any second approved origin to the comma-separated `TRUSTED_ORIGINS` allowlist. Set `AUTH_IP_HEADER=x-forwarded-for` only when Tailscale Serve is the sole path to that loopback listener; this lets Better Auth use Serve's forwarded client address without trusting a header on a directly reachable origin.

```bash
docker run -d --name app --env-file .env -p 127.0.0.1:3000:3000 your-image
TAILSCALE_TARGET=http://127.0.0.1:3000 pnpm tailscale:serve
pnpm tailscale:check
```

Tailscale access-control grants still decide which tailnet users and devices can reach the host. The application then requires its normal Better Auth session and server-side workspace/role authorization. Do not treat `Tailscale-User-*` request headers as authentication: the template deliberately ignores them, so a direct connection cannot spoof a SaaS identity.

For Docker-only appliances, Tailscale also publishes an official container image and Docker Desktop integration. Those approaches require node state and an auth method, so they are not added to the default Compose file or application image. Prefer the host daemon unless the deployment genuinely cannot provide it.

## Railway and public exposure

Railway remains the default public deployment and needs no Tailscale variables. Use its HTTPS domain for `APP_URL` and `BETTER_AUTH_URL`. These scripts do not silently join a Railway container to a tailnet and do not make a Railway service private.

Tailscale Funnel is intentionally not automated because it exposes the service to the public internet. Use the normal Railway/custom-domain path for a public SaaS application. If you explicitly choose Funnel later, review authentication, rate limiting, and the tailnet's Funnel policy first.

Current command references:

- [Tailscale Serve](https://tailscale.com/docs/reference/tailscale-cli/serve)
- [Tailscale HTTPS](https://tailscale.com/docs/how-to/set-up-https-certificates)
- [Tailscale Docker parameters](https://tailscale.com/docs/features/containers/docker/docker-params)
