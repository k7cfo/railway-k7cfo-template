import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import { spawnSync } from "node:child_process";

const checks = [];
function command(name, args, fix, optional = false) {
  const result = spawnSync(name, args, { encoding: "utf8" });
  checks.push({
    name,
    ok: result.status === 0,
    detail: result.status === 0 ? (result.stdout || result.stderr).trim().split("\n")[0] : fix,
    optional,
  });
}
command("node", ["--version"], "Install Node.js 22 LTS.");
command("pnpm", ["--version"], "Run: corepack enable");
command("docker", ["--version"], "Install and start Docker.");
command("op", ["--version"], "Optional: install 1Password CLI.", true);
command("railway", ["--version"], "Optional: install Railway CLI.", true);
checks.push({
  name: ".env",
  ok: existsSync(".env"),
  detail: existsSync(".env") ? "present" : "Run: cp .env.example .env",
  optional: false,
});
await new Promise((resolve) => {
  const socket = createConnection({ host: "127.0.0.1", port: 5432 });
  socket.on("connect", () => {
    checks.push({ name: "PostgreSQL port", ok: true, detail: "reachable on 5432", optional: false });
    socket.destroy();
    resolve();
  });
  socket.on("error", () => {
    checks.push({
      name: "PostgreSQL port",
      ok: false,
      detail: "Run: docker compose up -d postgres",
      optional: false,
    });
    resolve();
  });
});
for (const port of [3000, 5173])
  await new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.on("connect", () => {
      checks.push({
        name: `Port ${port}`,
        ok: false,
        detail: "already in use; stop the existing process",
        optional: true,
      });
      socket.destroy();
      resolve();
    });
    socket.on("error", () => {
      checks.push({ name: `Port ${port}`, ok: true, detail: "available", optional: true });
      resolve();
    });
  });
for (const item of checks)
  console.log(`${item.ok ? "✓" : item.optional ? "·" : "✗"} ${item.name}: ${item.detail}`);
if (checks.some((item) => !item.ok && !item.optional)) {
  console.error("\nDoctor found required fixes above.");
  process.exit(1);
}
console.log(
  "\nCore development requirements look healthy. Run pnpm db:migrate to verify database credentials and migration state.",
);
