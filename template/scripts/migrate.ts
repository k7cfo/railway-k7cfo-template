import "../src/env.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db/index.js";

await migrate(db, { migrationsFolder: "drizzle" });
await pool.end();
console.info("Database migrations are current.");
