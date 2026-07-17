import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const assetsDirectory = path.resolve("dist/public/assets");
const budgetBytes = Number(process.env.CLIENT_JS_BUDGET_KB || 950) * 1024;
const chunkBudgetBytes = Number(process.env.CLIENT_JS_CHUNK_BUDGET_KB || 500) * 1024;
const files = (await readdir(assetsDirectory)).filter((name) => name.endsWith(".js"));
const assets = await Promise.all(
  files.map(async (name) => ({ name, size: (await stat(path.join(assetsDirectory, name))).size })),
);
const totalBytes = assets.reduce((total, asset) => total + asset.size, 0);
const largest = assets.toSorted((left, right) => right.size - left.size)[0];
const largestBytes = largest?.size ?? 0;

if (totalBytes > budgetBytes) {
  console.error(
    `Client JavaScript is ${(totalBytes / 1024).toFixed(1)} KB; the budget is ${(budgetBytes / 1024).toFixed(0)} KB. Remove unused code or split large routes before deploying.`,
  );
  process.exit(1);
}

if (largest && largest.size > chunkBudgetBytes) {
  console.error(
    `${largest.name} is ${(largest.size / 1024).toFixed(1)} KB; the per-chunk budget is ${(chunkBudgetBytes / 1024).toFixed(0)} KB. Lazy-load page groups or remove unused browser code before deploying.`,
  );
  process.exit(1);
}

console.log(
  `Client JavaScript budget passed: ${(totalBytes / 1024).toFixed(1)} KB total of ${(budgetBytes / 1024).toFixed(0)} KB; largest chunk ${(largestBytes / 1024).toFixed(1)} KB of ${(chunkBudgetBytes / 1024).toFixed(0)} KB.`,
);
