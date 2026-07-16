import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const assetsDirectory = path.resolve("dist/public/assets");
const budgetBytes = Number(process.env.CLIENT_JS_BUDGET_KB || 950) * 1024;
const files = (await readdir(assetsDirectory)).filter((name) => name.endsWith(".js"));
const sizes = await Promise.all(
  files.map(async (name) => (await stat(path.join(assetsDirectory, name))).size),
);
const totalBytes = sizes.reduce((total, size) => total + size, 0);

if (totalBytes > budgetBytes) {
  console.error(
    `Client JavaScript is ${(totalBytes / 1024).toFixed(1)} KB; the budget is ${(budgetBytes / 1024).toFixed(0)} KB. Remove unused code or split large routes before deploying.`,
  );
  process.exit(1);
}

console.log(
  `Client JavaScript budget passed: ${(totalBytes / 1024).toFixed(1)} KB of ${(budgetBytes / 1024).toFixed(0)} KB.`,
);
