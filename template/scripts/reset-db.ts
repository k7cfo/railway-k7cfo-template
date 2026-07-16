import { sql } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { env } from "../src/env.js";
import { spawnSync } from "node:child_process";

if (env.NODE_ENV === "production") {
  console.error("Refusing to reset the database because NODE_ENV=production.");
  process.exit(1);
}
await db.execute(sql`drop schema public cascade; create schema public`);
await pool.end();
for (const command of [
  ["pnpm", ["db:migrate"]],
  ["pnpm", ["db:seed"]],
] as const) {
  const result = spawnSync(command[0], command[1], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
