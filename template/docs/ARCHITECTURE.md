# Architecture

The generated application is one TypeScript modular monolith. Vite builds the React SPA into `dist/public`; tsup builds Hono into `dist/server.js`; the Node process serves API, Better Auth, static assets, and SPA fallback together. PostgreSQL is the only stateful service.

Server code lives in `src/`: database schema and access in `src/db`, authorization in `src/lib`, vendor boundaries in `src/services`, and HTTP composition in `src/app.ts`. Client code lives in `web/src`: the typed navigation config, reusable application shell, pages, and preserved Nothing/Apex/Onyx tokens.

Business modules may call provider interfaces but never provider SDKs. Workspace access is enforced in server authorization helpers before queries or mutations. Personas are presentation metadata only.
