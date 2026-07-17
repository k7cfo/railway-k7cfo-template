# Architecture

The generated application is one TypeScript modular monolith. Vite builds the React SPA into `dist/public`; tsup builds Hono into `dist/server.js`; the Node process serves API, Better Auth, static assets, and SPA fallback together. PostgreSQL is the only stateful service.

The normal deployment is one web service plus PostgreSQL. A tailnet-only Railway deployment may add the optional `ops/tailscale-proxy` service; it is a network edge proxy, not an application microservice, and application code remains in the single web container.

Server code lives in `src/`: database schema and access in `src/db`, authorization in `src/lib`, vendor boundaries in `src/services`, and HTTP composition in `src/app.ts`. Client code lives in `web/src`: the typed navigation config, reusable application shell, pages, and preserved Nothing/Apex/Onyx tokens.

Business modules may call provider interfaces but never provider SDKs. Workspace access is enforced in server authorization helpers before queries or mutations. Personas are presentation metadata only.

Tailscale is an optional edge proxy, not an application service. The host's Tailscale daemon terminates private HTTPS and proxies to the same loopback-bound development or production port. The application continues to use Better Auth and its explicit origin allowlist; it does not trust Tailscale identity headers or import a Tailscale SDK.

Authentication rate limiting uses the configurable `AUTH_IP_HEADER` edge boundary. It defaults to Railway's sanitized `X-Real-IP`; deployments on another platform must name a client-IP header that their trusted proxy overwrites. This is configuration at the HTTP edge, not a Railway dependency in domain code.
