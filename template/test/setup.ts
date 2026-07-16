import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5432/test_app";
process.env.BETTER_AUTH_SECRET ||= "test-secret-only-not-for-production-1234567890";
process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
process.env.APP_URL ||= "http://localhost:5173";
process.env.EMAIL_PROVIDER ||= "console";

const { migrate } = await import("drizzle-orm/node-postgres/migrator");
const { db } = await import("../src/db/index.js");
await migrate(db, { migrationsFolder: "drizzle" });
