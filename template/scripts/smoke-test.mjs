import { spawn } from "node:child_process";
import { createServer } from "node:net";

const timeoutMs = 30_000;
const logs = [];

function fail(message) {
  throw new Error(`${message}\n\nProduction server output:\n${logs.join("").slice(-8_000)}`);
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("Could not allocate a port."));
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function waitFor(url, child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) fail(`Production server exited with code ${child.exitCode}.`);
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`Production server did not become healthy within ${timeoutMs / 1000} seconds.`);
}

async function expectJson(baseUrl, path, status, expected) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (response.status !== status) fail(`${path} returned ${response.status}; expected ${status}.`);
  const body = await response.json();
  for (const [key, value] of Object.entries(expected))
    if (body[key] !== value) fail(`${path} returned an unexpected ${key}.`);
}

const port = process.env.SMOKE_PORT || String(await availablePort());
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["dist/server.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: port,
    APP_URL: baseUrl,
    BETTER_AUTH_URL: baseUrl,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
child.stderr.on("data", (chunk) => logs.push(chunk.toString()));

try {
  await waitFor(`${baseUrl}/health`, child);
  await expectJson(baseUrl, "/health", 200, { status: "ok" });
  await expectJson(baseUrl, "/ready", 200, { status: "ready" });
  await expectJson(baseUrl, "/api/me", 401, { error: "Authentication required" });

  const spa = await fetch(`${baseUrl}/settings/profile`);
  const html = await spa.text();
  if (!spa.ok || !spa.headers.get("content-type")?.includes("text/html") || !html.includes('id="root"'))
    fail("Nested SPA fallback did not return the compiled application shell.");

  console.log("✓ Production server started");
  console.log("✓ /health and database-backed /ready passed");
  console.log("✓ Protected API rejected an anonymous request");
  console.log("✓ Nested SPA fallback returned the compiled application");
  console.log("Production smoke test passed.");
} finally {
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 10_000).unref()),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}
