import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const file of ["Dockerfile", "railway.json", "drizzle", "dist/server.js", "dist/public/index.html"])
  if (!existsSync(file)) {
    console.error(`Missing deploy artifact: ${file}. Run pnpm build first.`);
    process.exit(1);
  }
const gitFiles = spawnSync("git", ["ls-files"], { encoding: "utf8" });
if (gitFiles.error?.code === "ENOENT") {
  console.error("Git is required for the tracked-secret check. Install Git, then rerun pnpm verify.");
  process.exit(1);
}
if (gitFiles.status !== 0) {
  console.error("Could not inspect tracked files. Run this command from the application's Git repository.");
  process.exit(1);
}
const tracked = gitFiles.stdout.split("\n");
const unsafe = tracked.filter(
  (name) => /(^|\/)\.env($|\.)|\.pem$|\.key$/.test(name) && !name.endsWith(".example"),
);
if (unsafe.length) {
  console.error(`Potential secret files are tracked: ${unsafe.join(", ")}`);
  process.exit(1);
}
const dockerfile = readFileSync("Dockerfile", "utf8");
if (!dockerfile.includes("USER app")) {
  console.error("Dockerfile must run as the non-root app user.");
  process.exit(1);
}
console.log("Deployment structure and tracked-secret checks passed.");
