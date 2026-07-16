import { existsSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

writeFileSync(".railway-k7cfo-template", "generated-by: railway-k7cfo-template\n");
if (!existsSync("CLAUDE.md")) symlinkSync("AGENTS.md", "CLAUDE.md");
if (!existsSync(".git")) spawnSync("git", ["init", "-b", "main"], { stdio: "inherit" });
console.log("Generated marker and local Git repository are ready. Dependencies are installed by pnpm setup.");
