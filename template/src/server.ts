import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { pool } from "./db/index.js";
import { env } from "./env.js";

const app = createApp();
const server = serve({ fetch: app.fetch, hostname: "0.0.0.0", port: env.PORT }, ({ address, port }) => {
  console.info(`Server listening on http://${address}:${port}`);
});

async function shutdown(signal: string) {
  console.info(`${signal} received; shutting down gracefully.`);
  server.close(async (error) => {
    await pool.end();
    process.exit(error ? 1 : 0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
