import "dotenv/config";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

type TailscaleStatus = { Self?: { DNSName?: string } };

function fail(message: string): never {
  throw new Error(message);
}

export function normalizeTailnetUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return fail("TAILSCALE_URL must be a valid HTTPS origin.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    return fail("TAILSCALE_URL must be an exact HTTPS origin with no path, query, or credentials.");
  }
  return url.origin;
}

export function tailnetUrlFromStatus(input: string, override = ""): string {
  if (override.trim()) return normalizeTailnetUrl(override.trim());
  let status: TailscaleStatus;
  try {
    status = JSON.parse(input) as TailscaleStatus;
  } catch {
    return fail("Tailscale returned unreadable status JSON. Update Tailscale and try again.");
  }
  const dnsName = status.Self?.DNSName?.replace(/\.$/, "");
  if (!dnsName) return fail("This Tailscale node has no MagicDNS name. Enable MagicDNS, then try again.");
  return normalizeTailnetUrl(`https://${dnsName}`);
}

export function normalizeLocalTarget(value: string): string {
  let target: URL;
  try {
    target = new URL(value);
  } catch {
    return fail("TAILSCALE_TARGET must be a loopback HTTP URL such as http://127.0.0.1:5173.");
  }
  if (
    !["http:", "https:"].includes(target.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) ||
    target.username ||
    target.password
  ) {
    return fail("TAILSCALE_TARGET must point to an HTTP service on 127.0.0.1, localhost, or ::1.");
  }
  return target.href.replace(/\/$/, "");
}

export function mergeOrigins(...groups: Array<string | undefined>): string {
  return [
    ...new Set(
      groups
        .flatMap((group) => group?.split(",") ?? [])
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  ].join(",");
}

function runTailscale(args: string[], capture = false) {
  const result = spawnSync("tailscale", args, {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error && "code" in result.error && result.error.code === "ENOENT") {
    return fail("Tailscale CLI was not found. Install Tailscale, sign in, and rerun this command.");
  }
  if (result.status !== 0) {
    const detail = capture ? (result.stderr || result.stdout).trim() : "";
    return fail(
      detail || "Tailscale is unavailable. Run `tailscale status` and confirm this device is connected.",
    );
  }
  return result.stdout;
}

function tailnetUrl(): string {
  if (process.env.TAILSCALE_URL?.trim()) return normalizeTailnetUrl(process.env.TAILSCALE_URL.trim());
  const status = runTailscale(["status", "--json"], true);
  return tailnetUrlFromStatus(status);
}

function target(defaultPort: number): string {
  return normalizeLocalTarget(process.env.TAILSCALE_TARGET || `http://127.0.0.1:${defaultPort}`);
}

function configureServe(defaultPort: number): string {
  const url = tailnetUrl();
  const localTarget = target(defaultPort);
  runTailscale(["serve", "--bg", localTarget]);
  console.log(`Private URL: ${url}`);
  console.log(`Tailscale Serve: ${url} → ${localTarget}`);
  return url;
}

async function expectResponse(baseUrl: string, path: string, status: number, content?: string) {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { redirect: "manual", signal: AbortSignal.timeout(8_000) });
  } catch {
    return fail(
      `${path} could not be reached through Tailscale. Start the app and check Tailscale Serve status.`,
    );
  }
  if (response.status !== status) return fail(`${path} returned ${response.status}; expected ${status}.`);
  if (content && !(await response.text()).includes(content))
    return fail(`${path} returned unexpected content.`);
  console.log(`✓ ${path} returned ${status}`);
}

async function check() {
  const url = tailnetUrl();
  await expectResponse(url, "/health", 200, '"status":"ok"');
  await expectResponse(url, "/ready", 200, '"status":"ready"');
  await expectResponse(url, "/api/me", 401, "Authentication required");
  await expectResponse(url, "/settings/profile", 200, 'id="root"');
  console.log(`Tailscale smoke test passed: ${url}`);
}

async function dev() {
  const url = configureServe(5173);
  const hostname = new URL(url).hostname;
  const child = spawn("pnpm", ["dev"], {
    env: {
      ...process.env,
      APP_URL: url,
      BETTER_AUTH_URL: url,
      TRUSTED_ORIGINS: mergeOrigins(
        process.env.TRUSTED_ORIGINS,
        url,
        "http://localhost:5173,http://localhost:3000",
      ),
      __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: mergeOrigins(
        process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS,
        hostname,
      ),
    },
    stdio: "inherit",
  });
  const exitCode = await new Promise<number>((resolveExit) => {
    child.once("exit", (code) => resolveExit(code ?? 1));
    child.once("error", () => resolveExit(1));
  });
  process.exitCode = exitCode;
}

async function main() {
  const action = process.argv[2];
  if (action === "dev") return dev();
  if (action === "serve") return void configureServe(3000);
  if (action === "status") {
    const url = tailnetUrl();
    runTailscale(["serve", "status"]);
    console.log(`Expected private URL: ${url}`);
    return;
  }
  if (action === "check") return check();
  if (action === "off") {
    runTailscale(["serve", "--https=443", "off"]);
    console.log("Disabled this machine's HTTPS Serve endpoint on port 443.");
    return;
  }
  return fail("Use one of: dev, serve, status, check, off.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
